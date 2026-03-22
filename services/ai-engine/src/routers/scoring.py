from fastapi import APIRouter, HTTPException

from src.models.scoring import (
    GapAnalysisRequest,
    GapAnalysisResponse,
    MatchScoreRequest,
    MatchScoreResponse,
)

router = APIRouter(prefix="/ai", tags=["Scoring"])


@router.post("/match-score", response_model=MatchScoreResponse)
async def compute_match_score(request: MatchScoreRequest) -> MatchScoreResponse:
    """Compute a match score between a user profile and a job listing.

    TODO: Generate embeddings via OpenAI if not provided, compute
    cosine similarity, normalize to 0-100 scale, assign bucket.
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/gap-analysis", response_model=GapAnalysisResponse)
async def run_gap_analysis(request: GapAnalysisRequest) -> GapAnalysisResponse:
    """Analyze skill and experience gaps between a resume and job description.

    TODO: Call Anthropic Claude to compare parsed resume against the
    job description and produce structured gap analysis.
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")
