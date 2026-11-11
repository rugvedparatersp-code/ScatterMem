
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

@app.post("/api/admin/reset-test-data")
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

@app.post("/api/documents/upload")
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

@app.get("/api/documents")
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

@app.post("/api/documents/{document_id}/extract")
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


@app.post("/api/analyse/{document_id}")
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

@app.get("/api/knowledge")
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

@app.post("/api/tasks")
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


@app.get("/api/tasks")
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


@app.patch("/api/tasks/{task_id}/status")
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


@app.delete("/api/tasks/{task_id}")
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

@app.post("/api/decisions")
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


@app.get("/api/decisions")
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

@app.get("/api/reviews")
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


@app.post("/api/reviews/{finding_id}")
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


@app.get("/api/reviews/{finding_id}/history")
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

@app.get("/api/handover/report")
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

