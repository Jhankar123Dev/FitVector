import logging

from fastapi import APIRouter, HTTPException

from src.models.scoring import (
    GapAnalysisRequest,
    GapAnalysisResponse,
    MatchScoreRequest,
    MatchScoreResponse,
    SkillsToLearnRequest,
    SkillsToLearnResponse,
)
from src.services.embedding_service import (
    compute_match_score,
    generate_gap_analysis,
)
from src.services.skills_analytics import compute_skills_to_learn

logger = logging.getLogger("fitvector.router.scoring")

router = APIRouter(prefix="/ai", tags=["Scoring"])


@router.post("/match-score", response_model=MatchScoreResponse)
async def compute_match_score_endpoint(
    request: MatchScoreRequest,
) -> MatchScoreResponse:
    """Compute a blended match score between a user profile and a job listing.

    Returns: blended score (70% embedding + 30% deterministic), decision label,
    and full deterministic breakdown for skill visualization.
    """
    try:
        return await compute_match_score(request)
    except Exception as exc:
        logger.error("Match score error: %s", exc)
        raise HTTPException(
            status_code=500, detail=f"Match score computation failed: {str(exc)}"
        )


@router.post("/gap-analysis", response_model=GapAnalysisResponse)
async def run_gap_analysis_endpoint(
    request: GapAnalysisRequest,
) -> GapAnalysisResponse:
    """Analyze skill and experience gaps between a resume and job description.

    Uses Claude to produce structured gap analysis with matching skills,
    missing skills, experience gaps, strengths, and recommendations.
    """
    try:
        return await generate_gap_analysis(request)
    except Exception as exc:
        logger.error("Gap analysis error: %s", exc)
        raise HTTPException(
            status_code=500, detail=f"Gap analysis failed: {str(exc)}"
        )


@router.post("/skills-to-learn", response_model=SkillsToLearnResponse)
async def compute_skills_to_learn_endpoint(
    request: SkillsToLearnRequest,
) -> SkillsToLearnResponse:
    """Compute top 5 priority skills to learn based on tracked jobs.

    Requires at least 5 jobs in the tracker. Returns skills ranked by
    priority with impact messages.
    """
    try:
        return compute_skills_to_learn(
            user_skills=request.user_skills,
            tracker_jobs=request.tracker_jobs,
        )
    except Exception as exc:
        logger.error("Skills to learn error: %s", exc)
        raise HTTPException(
            status_code=500, detail=f"Skills analysis failed: {str(exc)}"
        )
