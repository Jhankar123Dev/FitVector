import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.services.ai_service import evaluate_interview, EvaluateInterviewResponse

logger = logging.getLogger("fitvector.router.interview")

router = APIRouter(prefix="/ai", tags=["Interview"])


# ── Request / Response models ─────────────────────────────────────────────────

class TranscriptEntry(BaseModel):
    question: str
    answer: str


class EvaluateInterviewRequest(BaseModel):
    job_title: str
    job_description: str = ""
    transcript: list[TranscriptEntry]


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/evaluate-interview", response_model=EvaluateInterviewResponse)
async def evaluate_interview_endpoint(
    request: EvaluateInterviewRequest,
) -> EvaluateInterviewResponse:
    """Evaluate a completed AI interview transcript using Gemini.

    Accepts a list of question/answer pairs plus job context and returns
    a structured evaluation: overall score, narrative summary, strengths,
    areas for improvement, and a hire recommendation.
    """
    if not request.transcript:
        raise HTTPException(status_code=400, detail="transcript must not be empty")

    try:
        result = await evaluate_interview(
            job_title=request.job_title,
            job_description=request.job_description,
            transcript=[{"question": e.question, "answer": e.answer} for e in request.transcript],
        )
        return result
    except ValueError as exc:
        logger.warning("Interview evaluation failed (unrecoverable AI response): %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.error("Evaluate interview error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Interview evaluation failed: {str(exc)}")
