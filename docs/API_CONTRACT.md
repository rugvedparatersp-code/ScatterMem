
# ScatterMem API Contract

## 1. Health Check

GET /api/health

Purpose: Check whether the backend is running.

Expected response:
{
  "status": "ok",
  "message": "ScatterMem backend is running"
}

## 2. Upload Document

POST /api/documents/upload

Purpose: Upload a PDF or DOCX document.

Request:
- multipart/form-data
- file: PDF or DOCX

Expected response:
{
  "document_id": "doc_001",
  "filename": "project_notes.pdf",
  "status": "uploaded"
}

## 3. Analyse Document

POST /api/analyse/{document_id}

Purpose: Extract project knowledge using AI.

Expected response:
{
  "decisions": [],
  "completed_tasks": [],
  "pending_tasks": [],
  "responsibilities": [],
  "dependencies": [],
  "risks": [],
  "knowledge_gaps": []
}

## 4. Review Findings

GET /api/findings/{document_id}

Purpose: Retrieve extracted findings for human review.

## 5. Update Finding

PATCH /api/findings/{finding_id}

Purpose: Edit or approve/reject an extracted finding.

## 6. Generate Handover Report

GET /api/reports/{document_id}

Purpose: Generate and download the final handover report.

## Important Rules

- All endpoints use JSON responses unless downloading a file.
- Every finding should include source evidence where available.
- Missing information must not be invented.
- API keys must never be exposed to the frontend.
- These endpoints are proposed contracts and must be implemented and tested before being treated as available.
