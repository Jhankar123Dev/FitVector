from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class JobSearchRequest(BaseModel):
    role: str = Field(..., description="Job title or role to search for")
    location: str = Field(..., description="City, state, or remote")
    sources: list[str] = Field(
        default=["indeed", "linkedin", "google", "naukri", "glassdoor"],
        description="Job boards to scrape",
    )
    hours_old: int = Field(default=72, description="Max age of listings in hours")
    results_wanted: int = Field(default=50, description="Number of results per source")
    country: str = Field(default="India", description="Country for locale-aware scraping")
    job_type: Optional[str] = Field(default=None, description="fulltime, parttime, etc.")
    is_remote: bool = Field(default=False, description="Filter for remote jobs only")


class ScrapedJob(BaseModel):
    title: str
    company_name: str
    location: str
    url: str
    description: str = ""
    source: str = ""
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    posted_at: Optional[datetime] = None
    job_type: Optional[str] = None
    work_mode: Optional[str] = None
    skills_required: list[str] = Field(default_factory=list)
    skills_nice_to_have: list[str] = Field(default_factory=list)
    required_experience_years: Optional[float] = None
    seniority: Optional[str] = None
    role_type: Optional[str] = None


class JobSearchResponse(BaseModel):
    jobs: list[ScrapedJob] = Field(default_factory=list)
    total_found: int = 0
    scrape_time_ms: int = 0
    source_results: dict[str, int] = Field(default_factory=dict)
