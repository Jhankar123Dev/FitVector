from typing import Any, Optional

from pydantic import BaseModel, Field


class MatchScoreRequest(BaseModel):
    user_embedding: Optional[list[float]] = Field(
        default=None, description="Pre-computed user profile embedding vector"
    )
    user_text: Optional[str] = Field(
        default=None, description="Raw user profile text (used if embedding is absent)"
    )
    job_embedding: Optional[list[float]] = Field(
        default=None, description="Pre-computed job description embedding vector"
    )
    job_text: Optional[str] = Field(
        default=None, description="Raw job description text (used if embedding is absent)"
    )


class MatchScoreResponse(BaseModel):
    match_score: int = Field(
        ..., ge=0, le=100, description="Normalized match score 0-100"
    )
    match_bucket: str = Field(
        ..., description="Qualitative bucket: low, medium, high, excellent"
    )
    similarity_raw: float = Field(
        ..., description="Raw cosine similarity value"
    )


class GapAnalysisRequest(BaseModel):
    parsed_resume: dict[str, Any] = Field(
        ..., description="Structured resume data"
    )
    job_description: str = Field(
        ..., description="Target job description text"
    )


class GapAnalysisResponse(BaseModel):
    matching_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    experience_gaps: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
