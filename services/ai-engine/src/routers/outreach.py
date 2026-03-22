import logging

from fastapi import APIRouter, HTTPException

from src.models.outreach import OutreachRequest, OutreachResponse
from src.services.ai_service import generate_outreach

logger = logging.getLogger("fitvector.router.outreach")

router = APIRouter(prefix="/ai", tags=["Outreach"])


@router.post("/cold-email", response_model=OutreachResponse)
async def generate_cold_email(request: OutreachRequest) -> OutreachResponse:
    """Generate a personalized cold email to a recruiter or hiring manager."""
    try:
        request.outreach_type = "cold_email"
        return await generate_outreach(request)
    except Exception as exc:
        logger.error("Cold email error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/linkedin-message", response_model=OutreachResponse)
async def generate_linkedin_message(request: OutreachRequest) -> OutreachResponse:
    """Generate a LinkedIn InMail / connection message (under 300 chars)."""
    try:
        request.outreach_type = "linkedin_inmail"
        return await generate_outreach(request)
    except Exception as exc:
        logger.error("LinkedIn message error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/referral-message", response_model=OutreachResponse)
async def generate_referral_message(request: OutreachRequest) -> OutreachResponse:
    """Generate a referral request message for a warm contact."""
    try:
        request.outreach_type = "referral_request"
        return await generate_outreach(request)
    except Exception as exc:
        logger.error("Referral message error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
