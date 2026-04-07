from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from src.services.ai_service import generate_questions

router = APIRouter()


class GenerateQuestionsRequest(BaseModel):
    topic: str
    questionType: str
    difficulty: str
    count: int
    codeLanguage: Optional[str] = None


@router.post("/ai/generate-questions")
async def generate_questions_endpoint(req: GenerateQuestionsRequest):
    questions = await generate_questions(
        topic=req.topic,
        question_type=req.questionType,
        difficulty=req.difficulty,
        count=req.count,
        code_language=req.codeLanguage,
    )
    return {"questions": questions}
