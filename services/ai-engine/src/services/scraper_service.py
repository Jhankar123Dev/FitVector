"""Job scraping service using JobSpy with deduplication, caching, and rate limiting."""

from __future__ import annotations

import asyncio
import json
import logging
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from src.config import settings
from src.models.job import JobSearchRequest, JobSearchResponse, ScrapedJob
from src.utils.proxy import get_proxy_config
from src.utils.rate_limiter import rate_limiter
from src.utils.text import job_fingerprint

# Path to the isolated jobspy runner script
_RUNNER_SCRIPT = Path(__file__).parent.parent / "utils" / "jobspy_runner.py"

logger = logging.getLogger("fitvector.scraper")

# Cache TTL: 24 hours
CACHE_TTL = timedelta(hours=24)

# In-memory cache keyed by (role, location, source_combo, hours_old)
_cache: dict[str, tuple[datetime, JobSearchResponse]] = {}

# Supported sources (this version of jobspy only has these 3)
VALID_SOURCES = {"indeed", "linkedin", "zip_recruiter"}

# Map our source names to jobspy site names
SOURCE_MAP = {
    "indeed": "indeed",
    "linkedin": "linkedin",
    "zip_recruiter": "zip_recruiter",
    # These are accepted by our API but mapped to working sources
    "google": "indeed",      # fallback — google not in this jobspy version
    "glassdoor": "linkedin",  # fallback — glassdoor not in this jobspy version
    "naukri": "indeed",       # fallback
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
    """Scrape a single source via jobspy.

    Runs jobspy in a **separate subprocess** so that if Playwright / Chromium
    crashes (segfault, OOM, etc.) it only kills the child process — the main
    uvicorn server stays alive.
    """
    await rate_limiter.acquire(source)

    jobspy_site = SOURCE_MAP.get(source, source)
    if jobspy_site not in VALID_SOURCES:
        logger.warning("Skipping unsupported source: %s", source)
        return []

    proxy = get_proxy_config()

    kwargs: dict[str, Any] = {
        "site_name": [jobspy_site],
        "search_term": role,
        "location": location,
        "results_wanted": results_wanted,
        "country_indeed": country,
    }
    if is_remote:
        kwargs["is_remote"] = True
    if job_type:
        kwargs["job_type"] = job_type
    if proxy:
        kwargs["proxy"] = proxy.get("https") or proxy.get("http")

    try:
        proc = await asyncio.wait_for(
            asyncio.create_subprocess_exec(
                sys.executable,
                str(_RUNNER_SCRIPT),
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            ),
            timeout=5.0,
        )

        stdin_data = json.dumps(kwargs).encode()
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(stdin_data),
            timeout=60.0,  # 60s per source — subprocess import is slow on Windows
        )

        stderr_text = stderr.decode().strip() if stderr else ""

        if proc.returncode not in (0, 1):
            logger.warning("jobspy subprocess exited %d for %s: %s", proc.returncode, source, stderr_text[:300])

        if stderr_text:
            logger.info("jobspy_runner [%s]: %s", source, stderr_text[:500])

        raw = stdout.decode().strip()
        if not raw:
            return []
        return json.loads(raw)

    except asyncio.TimeoutError:
        logger.warning("Source %s subprocess timed out — skipping", source)
        try:
            proc.kill()  # type: ignore[possibly-undefined]
        except Exception:
            pass
        return []
    except Exception as exc:
        logger.error("Source %s subprocess error: %s", source, exc)
        return []


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
            # Ensure timezone-aware (assume UTC if naive)
            if posted_dt and posted_dt.tzinfo is None:
                posted_dt = posted_dt.replace(tzinfo=timezone.utc)
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


_JOB_ANALYSIS_PROMPT = """You are a job description analyzer. Extract structured data from each job description.

For EACH job, return a JSON object with:
- "required_skills": skills CENTRAL to responsibilities (not just mentioned)
- "nice_to_have_skills": skills listed as "bonus", "preferred", "exposure to", or examples
- "required_experience_years": lower bound of stated range (e.g. "3-5 years" → 3). 0 if not stated.
- "seniority": "entry-level" | "junior" | "mid" | "senior" based on experience years
- "role_type": "backend" | "frontend" | "fullstack" | "data" | "devops" | "ai" | "mobile" | "design" | "qa" | "product"

Rules:
- Do NOT invent skills not mentioned in the text
- If experience range given, use the LOWER bound
- "Exposure" or "nice to have" = nice_to_have_skills, not required
- Classify "ai-adjacent" roles (uses AI tools but doesn't train models) as their primary type (e.g. "backend")
- Return ONLY a JSON array, no markdown fences, no extra text
"""


async def _analyze_batch(batch: list[ScrapedJob]) -> list[dict]:
    """Analyze a batch of jobs with Gemini Flash. Returns list of analysis dicts."""
    from src.services.ai_service import _call_gemini

    descriptions = []
    for i, job in enumerate(batch):
        desc = job.description[:800] if job.description else ""
        descriptions.append(f"[Job {i+1}] Title: {job.title}\n{desc}")

    user_prompt = f"Analyze these {len(batch)} job descriptions:\n\n" + "\n---\n".join(descriptions)

    try:
        raw = await _call_gemini(
            task="analyze_jobs",
            system_prompt=_JOB_ANALYSIS_PROMPT,
            user_prompt=user_prompt,
            max_tokens=2048,
            temperature=0.1,
        )
        # Strip markdown fences if present
        clean = raw.strip()
        if clean.startswith("```"):
            import re
            clean = re.sub(r"^```(?:json)?\s*", "", clean)
            clean = re.sub(r"\s*```$", "", clean)

        parsed = json.loads(clean)
        if isinstance(parsed, dict):
            parsed = [parsed]
        return parsed
    except Exception as exc:
        logger.warning("LLM job analysis batch failed: %s", exc)
        return []


async def analyze_jobs_with_llm(jobs: list[ScrapedJob]) -> list[ScrapedJob]:
    """Enrich jobs with LLM-extracted skills using concurrent Gemini Flash calls.

    Batches jobs 3 at a time and fires all batches concurrently with asyncio.gather.
    Falls back to keyword extraction on failure.
    """
    if not settings.enable_llm_job_analysis or not jobs:
        return jobs

    BATCH_SIZE = 3
    batches = [jobs[i:i + BATCH_SIZE] for i in range(0, len(jobs), BATCH_SIZE)]

    # Fire ALL batches concurrently — user requirement for <5s total
    results = await asyncio.gather(
        *[_analyze_batch(batch) for batch in batches],
        return_exceptions=True,
    )

    # Merge results back into jobs
    job_idx = 0
    for batch_idx, batch_result in enumerate(results):
        batch = batches[batch_idx]
        if isinstance(batch_result, Exception):
            logger.warning("LLM batch %d failed: %s", batch_idx, batch_result)
            job_idx += len(batch)
            continue

        for i, analysis in enumerate(batch_result):
            if job_idx + i >= len(jobs):
                break
            job = jobs[job_idx + i]
            if isinstance(analysis, dict):
                if analysis.get("required_skills"):
                    job.skills_required = analysis["required_skills"]
                if analysis.get("nice_to_have_skills"):
                    job.skills_nice_to_have = analysis["nice_to_have_skills"]
                if analysis.get("required_experience_years") is not None:
                    job.required_experience_years = analysis["required_experience_years"]
                if analysis.get("seniority"):
                    job.seniority = analysis["seniority"]
                if analysis.get("role_type"):
                    job.role_type = analysis["role_type"]

        job_idx += len(batch)

    analyzed = sum(1 for j in jobs if j.seniority is not None)
    logger.info("LLM analysis enriched %d/%d jobs", analyzed, len(jobs))
    return jobs


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

    # Deduplicate mapped sources so we don't scrape indeed/linkedin twice
    scraped_sites: set[str] = set()
    unique_sources: list[str] = []
    for source in request.sources:
        mapped = SOURCE_MAP.get(source, source)
        if mapped not in scraped_sites and mapped in VALID_SOURCES:
            scraped_sites.add(mapped)
            unique_sources.append(source)
        else:
            source_results[source] = 0

    logger.info("Scraping %d sources in parallel: %s", len(unique_sources), unique_sources)

    # Scrape ALL sources concurrently — much faster than sequential
    async def _scrape_with_error_handling(source: str) -> tuple[str, list[dict]]:
        try:
            raw = await _scrape_source(
                source=source,
                role=request.role,
                location=request.location,
                hours_old=request.hours_old,
                results_wanted=request.results_wanted,
                country=country,
                job_type=job_type,
                is_remote=is_remote,
            )
            return source, raw
        except Exception as exc:
            logger.error("Source %s failed: %s", source, exc)
            return source, []

    gather_results = await asyncio.gather(
        *[_scrape_with_error_handling(s) for s in unique_sources]
    )

    for source, raw_results in gather_results:
        jobs = [_normalize_job(r, source) for r in raw_results]
        source_results[source] = len(jobs)
        all_jobs.extend(jobs)
        if raw_results:
            logger.info("Source %s returned %d jobs", source, len(jobs))
        else:
            failed_sources.append(source)

    # Deduplicate
    unique_jobs = _deduplicate(all_jobs)
    logger.info("After dedup: %d jobs. Dates: %s", len(unique_jobs),
                [(j.title[:30], str(j.posted_at)) for j in unique_jobs[:5]])

    # Filter out old jobs — compare dates only (jobspy returns dates without times)
    if request.hours_old and request.hours_old > 0:
        cutoff_date = (datetime.now(timezone.utc) - timedelta(hours=request.hours_old)).date()
        before_count = len(unique_jobs)
        unique_jobs = [
            j for j in unique_jobs
            if j.posted_at is None or j.posted_at.date() >= cutoff_date
        ]
        filtered_out = before_count - len(unique_jobs)
        logger.info("Date filter (cutoff=%s): removed %d/%d jobs", cutoff_date, filtered_out, before_count)

    # Enrich jobs with LLM-extracted skills (concurrent Gemini Flash calls)
    unique_jobs = await analyze_jobs_with_llm(unique_jobs)

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
