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
    # Fields for deterministic scoring
    user_skills: Optional[list[str]] = Field(
        default=None, description="User's skills list for deterministic scoring"
    )
    job_required_skills: Optional[list[str]] = Field(
        default=None, description="Job's required skills"
    )
    job_nice_to_have_skills: Optional[list[str]] = Field(
        default=None, description="Job's nice-to-have skills"
    )
    user_role: Optional[str] = Field(
        default=None, description="User's primary role type"
    )
    job_role: Optional[str] = Field(
        default=None, description="Job's role type (from title)"
    )
    user_experience_years: Optional[float] = Field(
        default=None, description="User's years of experience"
    )
    job_required_experience_years: Optional[float] = Field(
        default=None, description="Job's required years of experience"
    )


class SkillMatchComponent(BaseModel):
    ratio: float = 0.0
    matched: list[str] = Field(default_factory=list)
    missing: list[str] = Field(default_factory=list)
    weight: int = 0


class RoleAlignmentComponent(BaseModel):
    score: float = 1.0
    user_role: str = ""
    job_role: str = ""
    weight: int = 15


class ExperienceAlignmentComponent(BaseModel):
    score: float = 1.0
    user_years: float = 0
    required_years: float = 0
    shortfall: float = 0
    weight: int = 15


class DeterministicComponents(BaseModel):
    required_skills_match: SkillMatchComponent = Field(default_factory=SkillMatchComponent)
    optional_skills_match: SkillMatchComponent = Field(default_factory=SkillMatchComponent)
    role_alignment: RoleAlignmentComponent = Field(default_factory=RoleAlignmentComponent)
    experience_alignment: ExperienceAlignmentComponent = Field(default_factory=ExperienceAlignmentComponent)


class MatchScoreResponse(BaseModel):
    match_score: int = Field(
        ..., ge=0, le=100, description="Blended match score 0-100"
    )
    match_bucket: str = Field(
        ..., description="Qualitative bucket: strong_fit, good_fit, potential_fit, weak_fit"
    )
    decision_label: str = Field(
        default="explore",
        description="Decision label: apply_now, prepare_then_apply, explore",
    )
    similarity_raw: float = Field(
        ..., description="Raw cosine similarity value"
    )
    embedding_score: Optional[int] = Field(
        default=None, description="Embedding-only score (for debugging)"
    )
    deterministic_score: Optional[int] = Field(
        default=None, description="Deterministic-only score (for debugging)"
    )
    deterministic_components: Optional[DeterministicComponents] = Field(
        default=None, description="Breakdown of deterministic score components"
    )


class SkillMatchResponse(BaseModel):
    matching: list[str] = Field(default_factory=list)
    missing: list[str] = Field(default_factory=list)
    extra: list[str] = Field(default_factory=list)


class GapAnalysisMatchingSkill(BaseModel):
    skill: str
    evidence: str


class GapAnalysisMissingSkill(BaseModel):
    skill: str
    importance: str = "important"  # critical, important, nice_to_have


class GapAnalysisRequest(BaseModel):
    parsed_resume: dict[str, Any] = Field(
        ..., description="Structured resume data"
    )
    job_title: str = Field(..., description="Job title")
    company_name: str = Field(default="", description="Company name")
    job_description: str = Field(
        ..., description="Target job description text"
    )
    skills_required: list[str] = Field(default_factory=list)
    experience_range: str = Field(default="", description="e.g. '3-7 years'")


class GapAnalysisResponse(BaseModel):
    matching_skills: list[GapAnalysisMatchingSkill] = Field(default_factory=list)
    missing_skills: list[GapAnalysisMissingSkill] = Field(default_factory=list)
    experience_gaps: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


# ─── Skills to Learn analytics models ───────────────────────────────────────


class SkillToLearn(BaseModel):
    skill: str
    priority_score: int
    required_in: int
    nice_to_have_in: int
    would_unlock: int
    message: str


class SkillsToLearnRequest(BaseModel):
    user_id: str
    user_skills: list[str] = Field(default_factory=list)
    tracker_jobs: list[dict[str, Any]] = Field(
        default_factory=list,
        description="List of tracker jobs with required_skills, nice_to_have_skills, decision_label",
    )


class SkillsToLearnResponse(BaseModel):
    skills_to_learn: list[SkillToLearn] = Field(default_factory=list)
