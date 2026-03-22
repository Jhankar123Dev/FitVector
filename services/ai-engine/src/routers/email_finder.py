from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/find", tags=["Email Finder"])


class RecruiterEmailRequest(BaseModel):
    full_name: str = Field(..., description="Recruiter's full name")
    company_domain: str = Field(..., description="Company domain (e.g. acme.com)")
    linkedin_url: Optional[str] = Field(
        default=None, description="Recruiter's LinkedIn profile URL"
    )


class RecruiterEmailResponse(BaseModel):
    email: Optional[str] = Field(default=None, description="Best-guess email address")
    confidence: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Confidence score 0-1"
    )
    sources: list[str] = Field(
        default_factory=list,
        description="Provider sources that returned results (hunter, apollo, snov)",
    )
    alternatives: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Other candidate emails with their confidence scores",
    )


@router.post("/recruiter-email", response_model=RecruiterEmailResponse)
async def find_recruiter_email(request: RecruiterEmailRequest) -> RecruiterEmailResponse:
    """Find a recruiter's email address using Hunter, Apollo, and Snov APIs.

    TODO: Fan out requests to all three providers in parallel via httpx,
    merge and deduplicate results, rank by confidence.
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")
