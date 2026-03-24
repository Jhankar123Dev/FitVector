import logging

from fastapi import APIRouter, File, HTTPException, Response, UploadFile

from src.models.resume import (
    CompilePdfRequest,
    ParseResumeResponse,
    TailorResumeRequest,
    TailorResumeResponse,
)
from src.services.ai_service import parse_resume_file, tailor_resume
from src.services.pdf_service import compile_latex_to_pdf

logger = logging.getLogger("fitvector.router.resume")

router = APIRouter(prefix="/ai", tags=["Resume"])


@router.post("/tailor-resume", response_model=TailorResumeResponse)
async def tailor_resume_endpoint(
    request: TailorResumeRequest,
) -> TailorResumeResponse:
    """Generate a tailored LaTeX resume for the given job description.

    Pipeline: parsed resume + JD → Gemini API → LaTeX → Tectonic PDF → Supabase upload.
    If PDF compilation fails, LaTeX source is still returned with error flag.
    """
    try:
        return await tailor_resume(request)
    except Exception as exc:
        logger.error("Tailor resume error: %s", exc)
        raise HTTPException(
            status_code=500, detail=f"Resume tailoring failed: {str(exc)}"
        )


@router.post("/compile-pdf")
async def compile_pdf(request: CompilePdfRequest) -> Response:
    """Compile LaTeX source to PDF using Tectonic and return raw PDF bytes.

    Called on-demand when the user requests a PDF download or preview.
    No storage involved — compile, return bytes, done.
    """
    if not request.latex_source.strip():
        raise HTTPException(status_code=400, detail="latex_source is required")

    pdf_bytes, error = await compile_latex_to_pdf(request.latex_source, timeout=30.0)

    if error or not pdf_bytes:
        raise HTTPException(
            status_code=422,
            detail=f"PDF compilation failed: {error or 'Unknown error'}",
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=resume.pdf"},
    )


@router.post("/parse-resume", response_model=ParseResumeResponse)
async def parse_resume(file: UploadFile = File(...)) -> ParseResumeResponse:
    """Parse an uploaded resume file (PDF or DOCX) into structured JSON.

    Pipeline: file upload → PyMuPDF / python-docx text extraction → Gemini Flash → structured JSON.
    """
    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Please upload a PDF or DOCX.",
        )

    try:
        file_bytes = await file.read()
        result = await parse_resume_file(file_bytes, file.content_type or "")
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Parse resume error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(exc)}")
