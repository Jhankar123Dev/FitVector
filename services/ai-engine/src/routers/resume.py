from fastapi import APIRouter, HTTPException

from src.models.resume import (
    ParseResumeRequest,
    ParseResumeResponse,
    TailorResumeRequest,
    TailorResumeResponse,
)

router = APIRouter(prefix="/ai", tags=["Resume"])


@router.post("/tailor-resume", response_model=TailorResumeResponse)
async def tailor_resume(request: TailorResumeRequest) -> TailorResumeResponse:
    """Generate a tailored LaTeX resume for the given job description.

    TODO: Call Anthropic/OpenAI to rewrite bullet points, compile LaTeX
    with Tectonic, upload PDF to Supabase storage.
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/parse-resume", response_model=ParseResumeResponse)
async def parse_resume(request: ParseResumeRequest) -> ParseResumeResponse:
    """Parse an uploaded resume file into structured JSON.

    TODO: Download file from Supabase storage, extract text via
    PyMuPDF / python-docx, call LLM for structured extraction.
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")
