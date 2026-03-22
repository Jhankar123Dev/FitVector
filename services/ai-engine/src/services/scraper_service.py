"""Job scraping service using JobSpy with deduplication, caching, and rate limiting."""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any

from src.models.job import JobSearchRequest, JobSearchResponse, ScrapedJob
from src.utils.proxy import get_proxy_config
from src.utils.rate_limiter import rate_limiter
from src.utils.text import job_fingerprint

logger = logging.getLogger("fitvector.scraper")

# Cache TTL: 24 hours
CACHE_TTL = timedelta(hours=24)

# In-memory cache keyed by (role, location, source_combo, hours_old)
_cache: dict[str, tuple[datetime, JobSearchResponse]] = {}

# Supported sources
VALID_SOURCES = {"indeed", "linkedin", "google", "glassdoor", "zip_recruiter"}

# Map our source names to jobspy site names
SOURCE_MAP = {
    "indeed": "indeed",
    "linkedin": "linkedin",
    "google": "google",
    "glassdoor": "glassdoor",
    "naukri": "indeed",  # naukri not natively in jobspy — fallback to indeed India
    "zip_recruiter": "zip_recruiter",
}


def _cache_key(request: JobSearchRequest) -> str:
    sources_sorted = ",".join(sorted(request.sources))
    return f"{request.role}|{request.location}|{sources_sorted}|{request.hours_old}"


def _get_cached(key: str) -> JobSearchResponse | None:
    """Return cached response if still fresh."""
    if key in _cache:
        cached_at, response = _cache[key]
        if datetime.now(timezone.utc) - cached_at < CACHE_TTL:
            return response
        del _cache[key]
    return None


def _set_cache(key: str, response: JobSearchResponse) -> None:
    _cache[key] = (datetime.now(timezone.utc), response)
    # Evict stale entries if cache grows too large
    if len(_cache) > 500:
        now = datetime.now(timezone.utc)
        stale = [k for k, (ts, _) in _cache.items() if now - ts >= CACHE_TTL]
        for k in stale:
            del _cache[k]


def _extract_skills_keyword(description: str) -> list[str]:
    """Fast keyword-based skill extraction from job descriptions."""
    SKILL_TAXONOMY = {
        "python", "javascript", "typescript", "java", "go", "rust", "c++",
        "ruby", "php", "swift", "kotlin", "scala", "r",
        "react", "vue", "angular", "next.js", "svelte", "html", "css", "tailwind",
        "node.js", "express", "fastapi", "django", "flask", "spring boot", "rails",
        "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb",
        "sqlite", "cassandra", "neo4j",
        "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ansible",
        "pandas", "numpy", "spark", "kafka", "airflow", "dbt",
        "tensorflow", "pytorch", "scikit-learn", "llm", "nlp",
        "computer vision", "deep learning", "machine learning",
        "git", "ci/cd", "jenkins", "github actions", "figma", "jira",
        "system design", "microservices", "rest api", "graphql", "agile", "scrum",
        "linux", "bash", "sql", "nosql", "api", "oauth", "jwt",
        "rabbitmq", "celery", "grpc", "websocket",
    }
    desc_lower = description.lower()
    return [skill for skill in SKILL_TAXONOMY if skill in desc_lower]


async def _scrape_source(
    source: str,
    role: str,
    location: str,
    hours_old: int,
    results_wanted: int,
    country: str,
    job_type: str | None,
    is_remote: bool,
) -> list[dict[str, Any]]:
    """Scrape a single source via jobspy. Runs in a thread since jobspy is sync."""

    await rate_limiter.acquire(source)

    jobspy_site = SOURCE_MAP.get(source, source)
    if jobspy_site not in VALID_SOURCES:
        logger.warning("Skipping unsupported source: %s", source)
        return []

    proxy = get_proxy_config()

    def _run_sync() -> list[dict[str, Any]]:
        try:
            from jobspy import scrape_jobs  # type: ignore[import-untyped]

            kwargs: dict[str, Any] = {
                "site_name": [jobspy_site],
                "search_term": role,
                "location": location,
                "results_wanted": results_wanted,
                "hours_old": hours_old,
                "country_indeed": country,
            }
            if is_remote:
                kwargs["is_remote"] = True
            if job_type:
                kwargs["job_type"] = job_type
            if proxy:
                kwargs["proxy"] = proxy.get("https") or proxy.get("http")

            df = scrape_jobs(**kwargs)
            if df is None or df.empty:
                return []
            return df.to_dict(orient="records")
        except Exception as exc:
            logger.error("Scrape failed for %s: %s", source, exc)
            return []

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _run_sync)


def _normalize_job(raw: dict[str, Any], source: str) -> ScrapedJob:
    """Convert a raw jobspy row to our ScrapedJob model."""
    description = str(raw.get("description") or "")
    posted = raw.get("date_posted")
    posted_dt = None
    if posted:
        try:
            if isinstance(posted, str):
                posted_dt = datetime.fromisoformat(posted)
            else:
                posted_dt = posted
        except (ValueError, TypeError):
            posted_dt = None

    salary_min = raw.get("min_amount")
    salary_max = raw.get("max_amount")

    return ScrapedJob(
        title=str(raw.get("title") or "Unknown"),
        company_name=str(raw.get("company_name") or raw.get("company") or "Unknown"),
        location=str(raw.get("location") or ""),
        url=str(raw.get("job_url") or raw.get("link") or ""),
        description=description,
        source=source,
        salary_min=float(salary_min) if salary_min else None,
        salary_max=float(salary_max) if salary_max else None,
        posted_at=posted_dt,
        job_type=str(raw.get("job_type") or "") or None,
        work_mode="remote" if raw.get("is_remote") else None,
        skills_required=_extract_skills_keyword(description),
    )


def _deduplicate(jobs: list[ScrapedJob]) -> list[ScrapedJob]:
    """Remove duplicate jobs by fingerprint (title + company + location)."""
    seen: set[str] = set()
    unique: list[ScrapedJob] = []
    for job in jobs:
        fp = job_fingerprint(job.title, job.company_name, job.location)
        if fp not in seen:
            seen.add(fp)
            unique.append(job)
    return unique


async def scrape_jobs(request: JobSearchRequest) -> JobSearchResponse:
    """Main entry point: scrape, deduplicate, cache, and return."""
    cache_key = _cache_key(request)
    cached = _get_cached(cache_key)
    if cached:
        logger.info("Cache hit for key=%s", cache_key[:40])
        return cached

    start = time.monotonic()
    all_jobs: list[ScrapedJob] = []
    source_results: dict[str, int] = {}
    failed_sources: list[str] = []

    # Parse optional fields
    country = getattr(request, "country", "India") or "India"
    job_type = getattr(request, "job_type", None)
    is_remote = getattr(request, "is_remote", False)

    # Fallback chain: scrape each source, continue on failure
    for source in request.sources:
        try:
            raw_results = await _scrape_source(
                source=source,
                role=request.role,
                location=request.location,
                hours_old=request.hours_old,
                results_wanted=request.results_wanted,
                country=country,
                job_type=job_type,
                is_remote=is_remote,
            )
            jobs = [_normalize_job(r, source) for r in raw_results]
            source_results[source] = len(jobs)
            all_jobs.extend(jobs)
            logger.info("Source %s returned %d jobs", source, len(jobs))
        except Exception as exc:
            logger.error("Source %s failed: %s", source, exc)
            failed_sources.append(source)
            source_results[source] = 0

    # Deduplicate
    unique_jobs = _deduplicate(all_jobs)
    elapsed_ms = int((time.monotonic() - start) * 1000)

    response = JobSearchResponse(
        jobs=unique_jobs,
        total_found=len(unique_jobs),
        scrape_time_ms=elapsed_ms,
        source_results=source_results,
    )

    # Cache the result
    _set_cache(cache_key, response)

    logger.info(
        "Scrape complete: %d unique jobs from %d sources in %dms (failed: %s)",
        len(unique_jobs),
        len(request.sources),
        elapsed_ms,
        failed_sources or "none",
    )

    return response
