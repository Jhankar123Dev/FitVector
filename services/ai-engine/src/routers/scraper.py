from fastapi import APIRouter, HTTPException

from src.models.job import JobSearchRequest, JobSearchResponse

router = APIRouter(prefix="/scrape", tags=["Job Scraping"])


@router.post("/jobs", response_model=JobSearchResponse)
async def scrape_jobs(request: JobSearchRequest) -> JobSearchResponse:
    """Scrape job listings from the requested sources.

    TODO: Integrate jobspy library to perform real scraping across
    LinkedIn, Indeed, Glassdoor, etc.
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")
