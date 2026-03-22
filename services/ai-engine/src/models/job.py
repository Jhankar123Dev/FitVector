from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class JobSearchRequest(BaseModel):
    role: str = Field(..., description="Job title or role to search for")
    location: str = Field(..., description="City, state, or remote")
    sources: list[str] = Field(
        default=["linkedin", "indeed"],
        description="Job boards to scrape (linkedin, indeed, glassdoor, etc.)",
    )
    hours_old: int = Field(default=72, description="Max age of listings in hours")
    results_wanted: int = Field(default=20, description="Number of results per source")


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


class JobSearchResponse(BaseModel):
    jobs: list[ScrapedJob] = Field(default_factory=list)
