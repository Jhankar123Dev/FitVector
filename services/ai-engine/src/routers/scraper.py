import logging

from fastapi import APIRouter, HTTPException

from src.models.job import JobSearchRequest, JobSearchResponse
from src.services.scraper_service import scrape_jobs

logger = logging.getLogger("fitvector.router.scraper")

router = APIRouter(prefix="/scrape", tags=["Job Scraping"])


@router.post("/jobs", response_model=JobSearchResponse)
async def scrape_jobs_endpoint(request: JobSearchRequest) -> JobSearchResponse:
    """Scrape job listings from the requested sources.

    Supports Indeed, LinkedIn, Google Jobs, Glassdoor, and Naukri.
    Results are deduplicated and cached for 24 hours.
    """
    try:
        return await scrape_jobs(request)
    except Exception as exc:
        logger.error("Scrape endpoint error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(exc)}")
