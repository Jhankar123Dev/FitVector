from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import asyncio

from src.services.ai_service import generate_questions, generate_job_description

router = APIRouter()


class GenerateQuestionsRequest(BaseModel):
    topic: str
    questionType: str          # "multiple_choice" | "code" | "mixed"
    difficulty: str
    count: int
    codeLanguage: Optional[str] = None
    # For mixed type: explicit MCQ + coding split
    mcqCount: Optional[int] = None
    codingCount: Optional[int] = None


@router.post("/ai/generate-questions")
async def generate_questions_endpoint(req: GenerateQuestionsRequest):
    """Generate questions. Supports single-type and mixed (MCQ + coding) batches."""

    if req.questionType == "mixed":
        mcq_count    = req.mcqCount    or max(1, req.count - 2)
        coding_count = req.codingCount or min(2, req.count)

        # Run MCQ and coding generation in parallel
        mcq_task = generate_questions(
            topic=req.topic,
            question_type="multiple_choice",
            difficulty=req.difficulty,
            count=mcq_count,
            code_language=None,
        )
        coding_task = generate_questions(
            topic=req.topic,
            question_type="code",
            difficulty=req.difficulty,
            count=coding_count,
            code_language=req.codeLanguage or "python3",
        )
        mcq_questions, coding_questions = await asyncio.gather(mcq_task, coding_task)
        return {"questions": mcq_questions + coding_questions}

    # Single type (original behaviour)
    questions = await generate_questions(
        topic=req.topic,
        question_type=req.questionType,
        difficulty=req.difficulty,
        count=req.count,
        code_language=req.codeLanguage,
    )
    return {"questions": questions}


class GenerateJobDescriptionRequest(BaseModel):
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    jobType: Optional[str] = None
    workMode: Optional[str] = None
    experienceMin: Optional[int] = None
    experienceMax: Optional[int] = None
    requiredSkills: Optional[List[str]] = None
    draftNotes: Optional[str] = None


@router.post("/ai/generate-job-description")
async def generate_job_description_endpoint(req: GenerateJobDescriptionRequest):
    """Generate a professional Markdown job description using Gemini."""
    description = await generate_job_description(
        title=req.title,
        department=req.department,
        location=req.location,
        job_type=req.jobType,
        work_mode=req.workMode,
        experience_min=req.experienceMin,
        experience_max=req.experienceMax,
        required_skills=req.requiredSkills or [],
        draft_notes=req.draftNotes,
    )
    return {"description": description}
