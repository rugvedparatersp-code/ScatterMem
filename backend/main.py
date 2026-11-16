
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

from jose import jwt, JWTError
from pwdlib import PasswordHash
from fastapi import Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import EmailStr

import os
import uuid
from pathlib import Path
from hmac import compare_digest
from typing import Optional

import fitz
from docx import Document as DocxDocument
from fastapi import FastAPI, File,Header,HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime, date

from services.ai_service import analyse_document

from database.database import (
    initialize_database,
     get_connection,
    save_document,
    get_all_documents,
    save_findings,
    get_all_findings,
    create_task,
    get_all_tasks,
    update_task_status,
    delete_task,
    create_decision,
    get_all_decisions,
    review_finding,
    get_finding_review_history,
    verify_document,
        create_user,
    get_user_by_username,
    get_user_by_email,
    get_user_by_id,
    get_all_users,
    update_user_role,
    update_user_status,

)


# ==========================================
# ROLELENS AUTHENTICATION CONFIGURATION
# ==========================================

load_dotenv()

SECRET_KEY = os.getenv("ROLELENS_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "ROLELENS_SECRET_KEY is missing. Add it to backend/.env"
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Password hashing
pwd_context = PasswordHash.recommended()

# JWT authentication
oauth2_scheme = HTTPBearer()


# ==========================================
# ROLELENS AUTHENTICATION HELPERS
# ==========================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(user_id: int):
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expires_at
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)



def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    user = get_user_by_id(user_id)

    if not user or not user["is_active"]:
        raise credentials_exception

    return user



def require_roles(*allowed_roles):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )

        return current_user

    return role_checker


# ==========================================
# ROLELENS: ROLE PERMISSION GROUPS
# ==========================================

ALL_ROLES = (
    "Admin",
    "Project Manager",
    "Developer",
    "Reviewer"
)

EDIT_ROLES = (
    "Admin",
    "Project Manager",
    "Developer"
)

MANAGER_ROLES = (
    "Admin",
    "Project Manager"
)

REVIEW_ROLES = (
    "Admin",
    "Project Manager",
    "Reviewer"
)


# --------------------------------------------------
# APPLICATION CONFIGURATION
# --------------------------------------------------

app = FastAPI(
    title="ScatterMem API",
    description="AI-powered project knowledge and handover platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://scattermem-react-temp.vercel.app",
        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# --------------------------------------------------
# DATABASE INITIALIZATION
# --------------------------------------------------

@app.on_event("startup")
def startup_event():
    initialize_database()

@app.post("/api/admin/reset-test-data", dependencies=[Depends(require_roles("Admin"))])
def reset_test_data(x_reset_token: str = Header(None)):
    expected_token = os.getenv("SCATTERMEM_RESET_TOKEN")

    if not expected_token or not x_reset_token:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not compare_digest(x_reset_token, expected_token):
        raise HTTPException(status_code=403, detail="Invalid token")

    connection = get_connection()

    try:
        connection.execute("DELETE FROM reviews")
        connection.execute("DELETE FROM findings")
        connection.execute("DELETE FROM documents")
        connection.execute("DELETE FROM tasks")
        connection.execute("DELETE FROM decisions")
        connection.commit()
    except Exception:
        connection.rollback()
        raise HTTPException(status_code=500, detail="Reset failed")
    finally:
        connection.close()

    for file in UPLOAD_DIR.iterdir():
        if file.is_file():
            file.unlink()

    return {"message": "Test data cleared successfully"}


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class TaskRequest(BaseModel):
    title: str = Field(min_length=1)
    description: Optional[str] = ""
    assigned_to: Optional[str] = ""
    priority: str = "Medium"
    due_date: Optional[str] = ""


class TaskStatusRequest(BaseModel):
    status: str


class DecisionRequest(BaseModel):
    title: str = Field(min_length=1)
    decision: str = Field(min_length=1)
    reasoning: str = Field(min_length=1)
    evidence: Optional[str] = ""
    impact: Optional[str] = ""
    decided_by: Optional[str] = ""


class FindingReviewRequest(BaseModel):
    review_status: str
    reviewer: Optional[str] = ""
    comments: Optional[str] = ""
    title: Optional[str] = None
    description: Optional[str] = None
    evidence: Optional[str] = None


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Welcome to ScatterMem API",
        "status": "running",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "application": "ScatterMem",
    }


# --------------------------------------------------
# DOCUMENT TEXT EXTRACTION
# --------------------------------------------------

def get_extracted_sections(file_path: Path):
    """
    Extract text from PDF page by page
    or DOCX paragraph by paragraph.
    """

    sections = []
    extension = file_path.suffix.lower()

    if extension == ".pdf":

        pdf_document = fitz.open(file_path)

        for page_number, page in enumerate(pdf_document, start=1):

            page_text = page.get_text("text").strip()

            if page_text:
                sections.append({
                    "location": f"Page {page_number}",
                    "text": page_text,
                })

        pdf_document.close()

    elif extension == ".docx":

        document = DocxDocument(file_path)

        for paragraph_number, paragraph in enumerate(
            document.paragraphs,
            start=1
        ):

            paragraph_text = paragraph.text.strip()

            if paragraph_text:
                sections.append({
                    "location": f"Paragraph {paragraph_number}",
                    "text": paragraph_text,
                })

    else:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported.",
        )

    return sections


# --------------------------------------------------
# UPLOAD DOCUMENT
# --------------------------------------------------

@app.post("/api/documents/upload", dependencies=[Depends(require_roles(*EDIT_ROLES))])
async def upload_document(file: UploadFile = File(...)):

    allowed_extensions = [".pdf", ".docx"]

    original_filename = Path(file.filename or "").name
    extension = Path(original_filename).suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed.",
        )

    if not original_filename:
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid filename.",
        )

    document_id = str(uuid.uuid4())

    safe_filename = f"{document_id}{extension}"
    file_path = UPLOAD_DIR / safe_filename

    try:

        file_content = await file.read()

        if not file_content:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

        file_path.write_bytes(file_content)

        file_type = extension.replace(".", "").upper()

        save_document(
            document_id,
            original_filename,
            file_type,
        )

        return {
            "message": "Document uploaded successfully.",
            "document_id": document_id,
            "filename": original_filename,
            "file_type": file_type,
        }

    except HTTPException:
        raise

    except Exception as error:

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=f"Document upload failed: {str(error)}",
        )


# --------------------------------------------------
# GET ALL DOCUMENTS
# --------------------------------------------------

@app.get("/api/documents", dependencies=[Depends(require_roles(*ALL_ROLES))])
def list_documents():

    try:
        documents = get_all_documents()

        return {
            "documents": documents,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve documents: {str(error)}",
        )


# --------------------------------------------------
# EXTRACT DOCUMENT TEXT
# --------------------------------------------------

@app.post("/api/documents/{document_id}/extract", dependencies=[Depends(require_roles(*EDIT_ROLES))])
def extract_document(document_id: str):

    documents = get_all_documents()

    selected_document = next(
        (
            document
            for document in documents
            if str(document["id"]) == document_id
        ),
        None,
    )

    if not selected_document:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    file_type = selected_document["file_type"].lower()

    file_path = UPLOAD_DIR / f"{document_id}.{file_type}"

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Uploaded document file not found.",
        )

    try:

        sections = get_extracted_sections(file_path)

        combined_text = "\n\n".join(
            section["text"] for section in sections
        )

        return {
            "document_id": document_id,
            "filename": selected_document["filename"],
            "total_sections": len(sections),
            "extracted_text": combined_text,
            "sections": sections,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Text extraction failed: {str(error)}",
        )


# --------------------------------------------------
# AI DOCUMENT ANALYSIS
# --------------------------------------------------


@app.post("/api/analyse/{document_id}", dependencies=[Depends(require_roles(*EDIT_ROLES))])
def analyse_uploaded_document(document_id: str):

    documents = get_all_documents()

    selected_document = next(
        (
            document
            for document in documents
            if str(document["id"]) == document_id
        ),
        None,
    )

    if not selected_document:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    file_type = selected_document["file_type"].lower()
    file_path = UPLOAD_DIR / f"{document_id}.{file_type}"

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Uploaded document file not found.",
        )

    try:
        sections = get_extracted_sections(file_path)

        if not sections:
            raise HTTPException(
                status_code=400,
                detail="No readable text was found in this document.",
            )

        combined_text = "\n\n".join(
            section.get("text", "")
            for section in sections
            if isinstance(section, dict)
        )

        if not combined_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No readable text was found in this document.",
            )

        analysis_result = analyse_document(sections)

        if not isinstance(analysis_result, dict):
            raise ValueError("AI analysis returned an invalid response.")

        findings = analysis_result.get("findings", [])

        if not isinstance(findings, list):
            raise ValueError("Analysis returned an invalid findings list.")

        if findings:
            save_findings(document_id, findings)

        return {
            "message": "Document analysed successfully.",
            "document_id": document_id,
            "document_summary": analysis_result.get("document_summary", ""),
            "total_findings": len(findings),
            "findings": findings,
            "missing_information": analysis_result.get("missing_information", []),
            "recommended_next_actions": analysis_result.get("recommended_next_actions", []),
        }

    except HTTPException:
        raise

    except Exception as error:
        print(f"ScatterMem analysis error: {error}")
        raise HTTPException(
            status_code=503,
            detail=f"Document analysis failed: {str(error)}",
        )


# --------------------------------------------------
# GET KNOWLEDGE FINDINGS
# --------------------------------------------------

@app.get("/api/knowledge", dependencies=[Depends(require_roles(*ALL_ROLES))])
def get_knowledge():

    try:
        findings = get_all_findings()

        return {
            "findings": findings,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve knowledge findings: {str(error)}",
        )


# ==================================================
# PENDING TASKS
# ==================================================

@app.post("/api/tasks", dependencies=[Depends(require_roles(*EDIT_ROLES))])
def add_task(task: TaskRequest):

    allowed_priorities = [
        "Low",
        "Medium",
        "High",
        "Critical",
    ]

    if task.priority not in allowed_priorities:
        raise HTTPException(
            status_code=400,
            detail="Invalid priority. Choose Low, Medium, High, or Critical.",
        )

    if not task.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Task title cannot be empty.",
        )

    try:
        create_task(
            task.title.strip(),
            task.description or "",
            task.assigned_to or "",
            task.priority,
            task.due_date or "",
        )

        return {
            "message": "Task created successfully.",
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not create task: {str(error)}",
        )


@app.get("/api/tasks", dependencies=[Depends(require_roles(*ALL_ROLES))])
def list_tasks():

    try:
        tasks = get_all_tasks()

        return {
            "tasks": tasks,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve tasks: {str(error)}",
        )


@app.patch("/api/tasks/{task_id}/status", dependencies=[Depends(require_roles(*EDIT_ROLES))])
def change_task_status(
    task_id: int,
    request: TaskStatusRequest,
):

    allowed_statuses = [
        "Pending",
        "In Progress",
        "Completed",
    ]

    if request.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid task status.",
        )

    try:
        updated = update_task_status(
            task_id,
            request.status,
        )

        if updated is False or updated == 0:
            raise HTTPException(
                status_code=404,
                detail="Task not found.",
            )

        return {
            "message": "Task status updated successfully.",
            "task_id": task_id,
            "status": request.status,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not update task: {str(error)}",
        )


@app.delete("/api/tasks/{task_id}", dependencies=[Depends(require_roles(*MANAGER_ROLES))])
def remove_task(task_id: int):

    try:
        deleted = delete_task(task_id)

        if deleted is False or deleted == 0:
            raise HTTPException(
                status_code=404,
                detail="Task not found.",
            )

        return {
            "message": "Task deleted successfully.",
            "task_id": task_id,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not delete task: {str(error)}",
        )


# ==================================================
# DECISION DNA
# ==================================================

@app.post("/api/decisions", dependencies=[Depends(require_roles(*MANAGER_ROLES))])
def add_decision(decision: DecisionRequest):

    if not decision.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Decision title cannot be empty.",
        )

    if not decision.decision.strip():
        raise HTTPException(
            status_code=400,
            detail="Decision description cannot be empty.",
        )

    if not decision.reasoning.strip():
        raise HTTPException(
            status_code=400,
            detail="Decision reasoning cannot be empty.",
        )

    try:
        create_decision(
            decision.title.strip(),
            decision.decision.strip(),
            decision.reasoning.strip(),
            decision.evidence or "",
            decision.impact or "",
            decision.decided_by or "",
        )

        return {
            "message": "Decision saved successfully.",
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save decision: {str(error)}",
        )


@app.get("/api/nexus-map", dependencies=[Depends(require_roles(*ALL_ROLES))])
def get_nexus_map():
    try:
        documents = get_all_documents()
        findings = get_all_findings()
        tasks = get_all_tasks()
        decisions = get_all_decisions()

        nodes = []
        edges = []

        # Document nodes
        for document in documents:
            nodes.append({
                "id": f"document-{document['id']}",
                "type": "document",
                "label": document.get("filename", "Untitled document"),
                "details": document
            })

        # Finding nodes and verified document relationships
        for finding in findings:
            finding_id = finding["id"]

            nodes.append({
                "id": f"finding-{finding_id}",
                "type": "finding",
                "label": finding.get("title", "Untitled finding"),
                "details": finding
            })

            document_id = finding.get("document_id")

            if document_id:
                edges.append({
                    "id": f"edge-document-finding-{document_id}-{finding_id}",
                    "source": f"document-{document_id}",
                    "target": f"finding-{finding_id}",
                    "relationship": "contains"
                })

        # Task nodes
        for task in tasks:
            task_id = task["id"]

            nodes.append({
                "id": f"task-{task_id}",
                "type": "task",
                "label": task.get("title", "Untitled task"),
                "details": task
            })

        # Decision nodes
        for decision in decisions:
            decision_id = decision["id"]

            nodes.append({
                "id": f"decision-{decision_id}",
                "type": "decision",
                "label": decision.get("title", "Untitled decision"),
                "details": decision
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "summary": {
                "documents": len(documents),
                "findings": len(findings),
                "tasks": len(tasks),
                "decisions": len(decisions),
                "total_nodes": len(nodes),
                "total_connections": len(edges)
            }
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not generate NEXUS MAP: {str(error)}"
        )


@app.get("/api/decisions", dependencies=[Depends(require_roles(*ALL_ROLES))])
def list_decisions():

    try:
        decisions = get_all_decisions()

        return {
            "decisions": decisions,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve decisions: {str(error)}",
        )


# ==================================================
# HUMAN REVIEW & APPROVAL
# ==================================================

@app.get("/api/reviews", dependencies=[Depends(require_roles(*ALL_ROLES))])
def list_findings_for_review():

    try:
        findings = get_all_findings()

        return {
            "findings": findings,
            "total": len(findings),
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve review findings: {str(error)}",
        )


@app.post("/api/reviews/{finding_id}", dependencies=[Depends(require_roles(*REVIEW_ROLES))])
def submit_finding_review(
    finding_id: int,
    request: FindingReviewRequest,
):

    allowed_statuses = ["Approved", "Rejected", "Needs Review"]

    if request.review_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid review status. Choose Approved, Rejected, or Needs Review.",
        )

    if request.title is not None and not request.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Finding title cannot be empty.",
        )

    try:
        updated = review_finding(
            finding_id=finding_id,
            review_status=request.review_status,
            reviewer=request.reviewer or "",
            comments=request.comments or "",
            title=request.title.strip() if request.title is not None else None,
            description=request.description,
            evidence=request.evidence,
        )

        if not updated:
            raise HTTPException(
                status_code=404,
                detail="Finding not found.",
            )

        return {
            "message": "Review saved successfully.",
            "finding_id": finding_id,
            "review_status": request.review_status,
        }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save finding review: {str(error)}",
        )


@app.get("/api/reviews/{finding_id}/history", dependencies=[Depends(require_roles(*ALL_ROLES))])
def get_review_history(finding_id: int):

    try:
        history = get_finding_review_history(finding_id)

        return {
            "finding_id": finding_id,
            "history": history,
            "total": len(history),
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve review history: {str(error)}",
        )
    
# ==================================================
# FINAL HANDOVER REPORT
# ==================================================

@app.get("/api/handover/report", dependencies=[Depends(require_roles(*ALL_ROLES))])
def generate_handover_report():

    try:
        documents = get_all_documents()
        findings = get_all_findings()
        tasks = get_all_tasks()
        decisions = get_all_decisions()

        # Separate findings by review status
        approved_findings = [
            item for item in findings
            if item.get("review_status") == "Approved"
        ]

        rejected_findings = [
            item for item in findings
            if item.get("review_status") == "Rejected"
        ]

        pending_findings = [
            item for item in findings
            if item.get("review_status") in [
                "needs_review",
                "Needs Review",
                None,
                ""
            ]
        ]

        # Separate tasks by completion status
        completed_tasks = [
            task for task in tasks
            if task.get("status") == "Completed"
        ]

        pending_tasks = [
            task for task in tasks
            if task.get("status") != "Completed"
        ]

        # Identify tasks without owners
        unassigned_tasks = [
            task for task in pending_tasks
            if not task.get("assigned_to")
            or not task.get("assigned_to").strip()
        ]

        # Recommended next actions
        next_actions = []

        for task in pending_tasks:
            next_actions.append({
                "action": task["title"],
                "owner": task.get("assigned_to") or "Unassigned",
                "priority": task.get("priority", "Medium"),
                "due_date": task.get("due_date") or "Not specified"
            })

        for finding in pending_findings:
            next_actions.append({
                "action": f"Review finding: {finding['title']}",
                "owner": "Project Reviewer",
                "priority": "Review required",
                "due_date": "Not specified"
            })

        # Build the final report
        report = {
            "report_title": "ScatterMem Project Handover Report",

            "generated_at": __import__("datetime").datetime.now().isoformat(),

            "project_overview": {
                "total_documents": len(documents),
                "total_findings": len(findings),
                "approved_findings": len(approved_findings),
                "rejected_findings": len(rejected_findings),
                "pending_review": len(pending_findings),
                "total_tasks": len(tasks),
                "completed_tasks": len(completed_tasks),
                "pending_tasks": len(pending_tasks),
                "total_decisions": len(decisions)
            },

            "documents": documents,

            "approved_knowledge": approved_findings,

            "pending_review_findings": pending_findings,

            "rejected_findings": rejected_findings,

            "completed_tasks": completed_tasks,

            "pending_tasks": pending_tasks,

            "unassigned_tasks": unassigned_tasks,

            "project_decisions": decisions,

            "recommended_next_actions": next_actions,

            "handover_status": (
                "Ready for review"
                if len(pending_findings) == 0
                else "Review required"
            )
        }

        return report

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not generate handover report: {str(error)}"
        )

    
# ==================================================
# DOCUMENT VERIFICATION
# ==================================================

@app.post("/api/documents/{document_id}/verify", dependencies=[Depends(require_roles(*EDIT_ROLES))])
def mark_document_verified(document_id: str):
    try:
        success = verify_document(document_id)

        if not success:
            raise HTTPException(
                status_code=404,
                detail="Document not found."
            )

        return {
            "success": True,
            "message": "Document verified successfully."
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not verify document: {str(error)}"
        )


# ==================================================
# MEMORY PULSE
# ==================================================

@app.get("/api/memory-pulse", dependencies=[Depends(require_roles(*ALL_ROLES))])
def get_memory_pulse():

    try:
        documents = get_all_documents()
        findings = get_all_findings()
        tasks = get_all_tasks()

        alerts = []
        today = date.today()

        # 1. STALE DOCUMENTS
        for doc in documents:

            last_verified = (
                doc.get("last_verified_at")
                or doc.get("upload_date")
            )

            if not last_verified:
                continue

            try:
                verified_date = datetime.fromisoformat(
                    str(last_verified).replace("Z", "+00:00")
                ).date()

                days_old = (today - verified_date).days

                if days_old >= 30:
                    alerts.append({
                        "id": f"stale-document-{doc['id']}",
                        "type": "stale_document",
                        "severity": "warning",
                        "title": "Document needs verification",
                        "description": (
                            f"{doc.get('filename', 'Document')} "
                            f"has not been verified for {days_old} days."
                        ),
                        "record_id": doc["id"],
                        "record_type": "document",
                        "next_action": "Review and verify this document."
                    })

            except (ValueError, TypeError):
                continue

        # 2. OVERDUE AND UNASSIGNED TASKS
        completed_statuses = {
            "completed", "done", "closed"
        }

        for task in tasks:

            status = str(
                task.get("status") or ""
            ).strip().lower()

            if status in completed_statuses:
                continue

            assigned_to = str(
                task.get("assigned_to") or ""
            ).strip()

            if not assigned_to:
                alerts.append({
                    "id": f"unassigned-task-{task['id']}",
                    "type": "unassigned_task",
                    "severity": "warning",
                    "title": "Task has no owner",
                    "description": task.get(
                        "title", "Untitled task"
                    ),
                    "record_id": task["id"],
                    "record_type": "task",
                    "next_action": "Assign this task to a team member."
                })

            due_date = task.get("due_date")

            if due_date:
                try:
                    parsed_due_date = date.fromisoformat(
                        str(due_date)[:10]
                    )

                    if parsed_due_date < today:
                        alerts.append({
                            "id": f"overdue-task-{task['id']}",
                            "type": "overdue_task",
                            "severity": "critical",
                            "title": "Task is overdue",
                            "description": (
                                f"{task.get('title', 'Untitled task')} "
                                f"was due on {parsed_due_date}."
                            ),
                            "record_id": task["id"],
                            "record_type": "task",
                            "next_action": (
                                "Update the task status or deadline."
                            )
                        })

                except (ValueError, TypeError):
                    continue

        # 3. PENDING REVIEWS
        for finding in findings:

            review_status = str(
                finding.get("review_status")
                or finding.get("status")
                or "needs_review"
            ).strip().lower()

            if review_status not in {"approved", "rejected"}:
                alerts.append({
                    "id": f"pending-review-{finding['id']}",
                    "type": "pending_review",
                    "severity": "warning",
                    "title": "Finding needs review",
                    "description": finding.get(
                        "title", "Untitled finding"
                    ),
                    "record_id": finding["id"],
                    "record_type": "finding",
                    "next_action": (
                        "Review and approve or reject this finding."
                    )
                })

        # 4. FINDINGS WITHOUT EVIDENCE
        for finding in findings:

            evidence = finding.get("evidence")

            if not evidence or not str(evidence).strip():
                alerts.append({
                    "id": f"missing-evidence-{finding['id']}",
                    "type": "missing_evidence",
                    "severity": "warning",
                    "title": "Finding has no supporting evidence",
                    "description": finding.get(
                        "title", "Untitled finding"
                    ),
                    "record_id": finding["id"],
                    "record_type": "finding",
                    "next_action": (
                        "Add supporting evidence to this finding."
                    )
                })

        # 5. SUMMARY
        summary = {
            "total_alerts": len(alerts),

            "critical": sum(
                1 for a in alerts
                if a["severity"] == "critical"
            ),

            "warnings": sum(
                1 for a in alerts
                if a["severity"] == "warning"
            ),

            "stale_documents": sum(
                1 for a in alerts
                if a["type"] == "stale_document"
            ),

            "overdue_tasks": sum(
                1 for a in alerts
                if a["type"] == "overdue_task"
            ),

            "unassigned_tasks": sum(
                1 for a in alerts
                if a["type"] == "unassigned_task"
            ),

            "pending_reviews": sum(
                1 for a in alerts
                if a["type"] == "pending_review"
            ),

            "missing_evidence": sum(
                1 for a in alerts
                if a["type"] == "missing_evidence"
            )
        }

        return {
            "success": True,
            "generated_at": datetime.now().isoformat(),
            "summary": summary,
            "alerts": alerts
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Memory Pulse failed: {str(error)}"
        )


# ==========================================
# ROLELENS: AUTHENTICATION API
# ==========================================

class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/api/auth/register")
def register_user(data: RegisterRequest):
    username = data.username.strip()
    email = str(data.email).strip().lower()
    full_name = data.full_name.strip()

    if not username or not full_name:
        raise HTTPException(
            status_code=400,
            detail="Username and full name cannot be empty"
        )

    if get_user_by_username(username):
        raise HTTPException(
            status_code=409,
            detail="Username already exists"
        )

    if get_user_by_email(email):
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    password_hash = get_password_hash(data.password)

    try:
        user_id = create_user(
            username=username,
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role="Developer"
        )
    except Exception:
        raise HTTPException(
            status_code=409,
            detail="Could not create account. Username or email may already exist."
        )

    return {
        "success": True,
        "message": "Account registered successfully",
        "user_id": user_id,
        "role": "Developer"
    }


@app.post("/api/auth/login")
def login_user(data: LoginRequest):
    user = get_user_by_username(data.username.strip())

    if not user or not verify_password(
        data.password,
        user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="Your account has been deactivated"
        )

    access_token = create_access_token(user["id"])

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }


@app.get("/api/auth/me")
def get_logged_in_user(
    current_user: dict = Depends(get_current_user)
):
    return {
        "success": True,
        "user": {
            "id": current_user["id"],
            "username": current_user["username"],
            "email": current_user["email"],
            "full_name": current_user["full_name"],
            "role": current_user["role"]
        }
    }


# ==========================================
# ROLELENS: ADMIN USER MANAGEMENT
# ==========================================

VALID_ROLES = [
    "Admin",
    "Project Manager",
    "Developer",
    "Reviewer"
]


class UpdateUserRoleRequest(BaseModel):
    role: str


class UpdateUserStatusRequest(BaseModel):
    is_active: bool


# 1. Admin: View all registered users
@app.get("/api/admin/users")
def admin_get_users(
    current_user: dict = Depends(require_roles("Admin"))
):
    return {
        "success": True,
        "users": get_all_users()
    }


# 2. Admin: Change a user's role
@app.patch("/api/admin/users/{user_id}/role")
def admin_update_user_role(
    user_id: int,
    data: UpdateUserRoleRequest,
    current_user: dict = Depends(require_roles("Admin"))
):
    if data.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    target_user = get_user_by_id(user_id)

    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user_id == current_user["id"] and data.role != "Admin":
        raise HTTPException(
            status_code=400,
            detail="You cannot remove your own Admin role"
        )

    if target_user["role"] == "Admin" and data.role != "Admin":
        active_admins = [
            user for user in get_all_users()
            if user["role"] == "Admin" and user["is_active"]
        ]

        if len(active_admins) <= 1:
            raise HTTPException(
                status_code=400,
                detail="At least one active Admin must remain"
            )

    update_user_role(user_id, data.role)

    return {
        "success": True,
        "message": "User role updated successfully",
        "user_id": user_id,
        "new_role": data.role
    }


# 3. Admin: Activate or deactivate a user
@app.patch("/api/admin/users/{user_id}/status")
def admin_update_user_status(
    user_id: int,
    data: UpdateUserStatusRequest,
    current_user: dict = Depends(require_roles("Admin"))
):
    target_user = get_user_by_id(user_id)

    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user_id == current_user["id"] and not data.is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account"
        )

    if target_user["role"] == "Admin" and not data.is_active:
        active_admins = [
            user for user in get_all_users()
            if user["role"] == "Admin" and user["is_active"]
        ]

        if len(active_admins) <= 1:
            raise HTTPException(
                status_code=400,
                detail="At least one active Admin must remain"
            )

    update_user_status(user_id, data.is_active)

    return {
        "success": True,
        "message": "User status updated successfully",
        "user_id": user_id,
        "is_active": data.is_active
    }
