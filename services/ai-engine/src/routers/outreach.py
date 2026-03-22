from fastapi import APIRouter, HTTPException

from src.models.outreach import OutreachRequest, OutreachResponse

router = APIRouter(prefix="/ai", tags=["Outreach"])


@router.post("/cold-email", response_model=OutreachResponse)
async def generate_cold_email(request: OutreachRequest) -> OutreachResponse:
    """Generate a personalized cold email to a recruiter or hiring manager.

    TODO: Call Anthropic Claude to draft the email using user profile,
    job context, and recruiter name.
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/linkedin-message", response_model=OutreachResponse)
async def generate_linkedin_message(request: OutreachRequest) -> OutreachResponse:
    """Generate a LinkedIn InMail / connection message.

    TODO: Call Anthropic Claude with LinkedIn-specific constraints
    (character limits, professional tone).
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/referral-message", response_model=OutreachResponse)
async def generate_referral_message(request: OutreachRequest) -> OutreachResponse:
    """Generate a referral request message for a warm contact.

    TODO: Call Anthropic Claude to draft a referral ask with
    appropriate context and gratitude framing.
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")
