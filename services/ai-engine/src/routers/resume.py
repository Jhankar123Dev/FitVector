import logging

from fastapi import APIRouter, HTTPException

from src.models.resume import (
    ParseResumeRequest,
    ParseResumeResponse,
    TailorResumeRequest,
    TailorResumeResponse,
)
from src.services.ai_service import tailor_resume

logger = logging.getLogger("fitvector.router.resume")

router = APIRouter(prefix="/ai", tags=["Resume"])


@router.post("/tailor-resume", response_model=TailorResumeResponse)
async def tailor_resume_endpoint(
    request: TailorResumeRequest,
) -> TailorResumeResponse:
    """Generate a tailored LaTeX resume for the given job description.

    Pipeline: parsed resume + JD → Claude API → LaTeX → Tectonic PDF → Supabase upload.
    If PDF compilation fails, LaTeX source is still returned with error flag.
    """
    try:
        return await tailor_resume(request)
    except Exception as exc:
        logger.error("Tailor resume error: %s", exc)
        raise HTTPException(
            status_code=500, detail=f"Resume tailoring failed: {str(exc)}"
        )


@router.post("/parse-resume", response_model=ParseResumeResponse)
async def parse_resume(request: ParseResumeRequest) -> ParseResumeResponse:
    """Parse an uploaded resume file into structured JSON.

    TODO: Download file from Supabase storage, extract text via
    PyMuPDF / python-docx, call LLM for structured extraction.
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")
