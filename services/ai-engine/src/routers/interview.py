import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.services.ai_service import (
    evaluate_interview,
    EvaluateInterviewResponse,
    generate_next_interview_question,
    NextQuestionResponse,
)

logger = logging.getLogger("fitvector.router.interview")

router = APIRouter(prefix="/ai", tags=["Interview"])


# ── Shared models ─────────────────────────────────────────────────────────────

class TranscriptEntry(BaseModel):
    question: str
    answer: str


# ── Evaluate interview ────────────────────────────────────────────────────────

class EvaluateInterviewRequest(BaseModel):
    job_title: str
    job_description: str = ""
    transcript: list[TranscriptEntry]


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


# ── Next interview question ───────────────────────────────────────────────────

class HistoryEntry(BaseModel):
    question: str
    answer: str


class NextQuestionRequest(BaseModel):
    job_title: str
    job_description: str = ""
    required_skills: list[str] = []
    interview_type: str = "general"
    interview_plan: dict = {}
    history: list[HistoryEntry] = []
    turn_number: int = 0
    max_turns: int = 7


@router.post("/next-interview-question", response_model=NextQuestionResponse)
async def next_interview_question_endpoint(
    request: NextQuestionRequest,
) -> NextQuestionResponse:
    """Generate the next adaptive interview question.

    On the first call (turn_number=0, empty history) returns the opening question.
    On subsequent calls, reads the conversation so far and decides whether to
    probe deeper, pivot to a new topic, or end the interview.
    """
    try:
        result = await generate_next_interview_question(
            job_title=request.job_title,
            job_description=request.job_description,
            required_skills=request.required_skills,
            interview_type=request.interview_type,
            interview_plan=request.interview_plan,
            history=[{"question": e.question, "answer": e.answer} for e in request.history],
            turn_number=request.turn_number,
            max_turns=request.max_turns,
        )
        return result
    except Exception as exc:
        logger.error("Next question error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to generate next question: {str(exc)}")
