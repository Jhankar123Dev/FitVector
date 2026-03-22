from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class OutreachRequest(BaseModel):
    user_profile: dict[str, Any] = Field(
        ..., description="User profile data (name, skills, experience summary)"
    )
    job: dict[str, Any] = Field(
        ..., description="Target job data (title, company, description)"
    )
    outreach_type: Literal["cold_email", "linkedin_inmail", "referral_request"] = Field(
        ..., description="Type of outreach message to generate"
    )
    tone: str = Field(
        default="professional",
        description="Desired tone (professional, casual, enthusiastic, etc.)",
    )
    recruiter_name: Optional[str] = Field(
        default=None, description="Recruiter or contact name for personalization"
    )


class OutreachResponse(BaseModel):
    subject: Optional[str] = Field(
        default=None, description="Email subject line (only for cold_email)"
    )
    subject_alternatives: Optional[list[str]] = Field(
        default=None, description="Alternative subject lines"
    )
    body: str = Field(..., description="Generated message body")
    personalization_points: list[str] = Field(
        default_factory=list,
        description="Key personalization hooks used in the message",
    )
