"""
AI Resume Screening Router
--------------------------
Triggered asynchronously by a Supabase DB webhook when an applicant's
pipeline_stage is set to 'ai_screening_in_progress'.

Flow:
  1. Stage route writes pipeline_stage = 'ai_screening_in_progress' → returns 200
  2. Supabase DB webhook fires POST /ai/screen-applicant (this endpoint)
  3. This endpoint calls Gemini, writes pipeline_stage = 'ai_screened' + results to DB
  4. Supabase Realtime notifies the employer Kanban board
"""

import logging
import json

import httpx
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from src.config import settings
from src.services.ai_service import _call_gemini  # reuse shared Gemini helper

logger = logging.getLogger("fitvector.router.screening")

router = APIRouter(prefix="/ai", tags=["Screening"])

# ── Shared Supabase REST helper ───────────────────────────────────────────────

def _supabase_headers() -> dict:
    return {
        "apikey": settings.supabase_service_key,
        "Authorization": f"Bearer {settings.supabase_service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def _supabase_get(path: str) -> dict | list | None:
    """GET from Supabase REST API."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{settings.supabase_url}/rest/v1/{path}",
            headers=_supabase_headers(),
        )
        if r.status_code not in (200, 206):
            logger.error("Supabase GET %s failed: %s %s", path, r.status_code, r.text)
            return None
        return r.json()


async def _supabase_patch(table: str, row_id: str, payload: dict) -> bool:
    """PATCH a single row in Supabase by id."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.patch(
            f"{settings.supabase_url}/rest/v1/{table}?id=eq.{row_id}",
            headers=_supabase_headers(),
            json=payload,
        )
        ok = r.status_code in (200, 204)
        if not ok:
            logger.error("Supabase PATCH %s id=%s failed: %s %s", table, row_id, r.status_code, r.text)
        return ok


# ── Screening logic ───────────────────────────────────────────────────────────

_SCREENING_SYSTEM_PROMPT = """\
You are an expert technical recruiter performing resume screening.
Given a job description and candidate resume/profile, evaluate the candidate's fit.
Respond with a valid JSON object only — no markdown fences, no extra text.

JSON schema:
{
  "overall_score": <integer 0-100>,
  "hire_recommendation": "<strong_yes | yes | maybe | no>",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "gaps": ["<gap 1>", "<gap 2>", ...],
  "skill_match": {
    "<skill>": <match_score 0-100>,
    ...
  }
}
"""


async def _run_screening(applicant_id: str, job_post_id: str) -> None:
    """Core screening logic — runs in background, writes results to DB."""
    logger.info("[screening] Starting for applicant=%s job=%s", applicant_id, job_post_id)

    try:
        # 1. Fetch applicant data
        applicant_rows = await _supabase_get(
            f"applicants?id=eq.{applicant_id}&select=id,name,email,resume_text,parsed_skills"
        )
        if not applicant_rows:
            logger.warning("[screening] Applicant %s not found — aborting", applicant_id)
            return
        applicant = applicant_rows[0] if isinstance(applicant_rows, list) else applicant_rows

        # 2. Fetch job post data
        job_rows = await _supabase_get(
            f"job_posts?id=eq.{job_post_id}&select=title,description,required_skills,nice_to_have_skills"
        )
        if not job_rows:
            logger.warning("[screening] Job %s not found — aborting", job_post_id)
            return
        job = job_rows[0] if isinstance(job_rows, list) else job_rows

        # 3. Build prompt
        resume_text = applicant.get("resume_text") or "No resume uploaded."
        parsed_skills = applicant.get("parsed_skills") or []
        required_skills = job.get("required_skills") or []
        nice_skills = job.get("nice_to_have_skills") or []

        user_prompt = f"""
JOB TITLE: {job.get("title", "")}

JOB DESCRIPTION:
{job.get("description", "")[:2000]}

REQUIRED SKILLS: {", ".join(required_skills)}
NICE-TO-HAVE: {", ".join(nice_skills)}

CANDIDATE RESUME / PROFILE:
{resume_text[:3000]}

CANDIDATE'S PARSED SKILLS: {", ".join(parsed_skills)}

Evaluate this candidate for the role.
"""

        # 4. Call Gemini (reuse shared helper with structured output)
        raw = await _call_gemini(
            task="evaluate_interview",           # reuses the same API key quota bucket
            system_prompt=_SCREENING_SYSTEM_PROMPT,
            user_prompt=user_prompt,
        )

        # Parse JSON response
        try:
            result = json.loads(raw.strip())
        except json.JSONDecodeError:
            # Try to extract JSON block from prose response
            import re
            m = re.search(r"\{.*\}", raw, re.DOTALL)
            if m:
                result = json.loads(m.group())
            else:
                raise ValueError(f"Gemini returned non-JSON: {raw[:200]}")

        overall_score = int(result.get("overall_score", 0))
        hire_rec = result.get("hire_recommendation", "maybe")
        summary = result.get("summary", "")
        strengths = result.get("strengths", [])
        gaps = result.get("gaps", [])
        skill_match = result.get("skill_match", {})

        # 5. Write results back to DB
        screening_result = {
            "overall_score": overall_score,
            "hire_recommendation": hire_rec,
            "summary": summary,
            "strengths": strengths,
            "gaps": gaps,
            "skill_match": skill_match,
        }

        await _supabase_patch(
            "applicants",
            applicant_id,
            {
                "pipeline_stage": "ai_screened",
                "ai_screening_result": screening_result,
                "ai_screening_score": overall_score,
            },
        )

        logger.info(
            "[screening] Done for applicant=%s: score=%d rec=%s",
            applicant_id, overall_score, hire_rec,
        )

    except Exception as exc:
        logger.error("[screening] Failed for applicant=%s: %s", applicant_id, exc)
        # Revert to ai_screened with error flag so the card doesn't stay in_progress forever
        await _supabase_patch(
            "applicants",
            applicant_id,
            {
                "pipeline_stage": "ai_screened",
                "ai_screening_result": {"error": str(exc), "overall_score": 0},
                "ai_screening_score": 0,
            },
        )


# ── Endpoint ──────────────────────────────────────────────────────────────────

class ScreenApplicantRequest(BaseModel):
    applicant_id: str
    job_post_id: str


@router.post("/screen-applicant", status_code=202)
async def screen_applicant_endpoint(
    request: ScreenApplicantRequest,
    background_tasks: BackgroundTasks,
) -> dict:
    """
    Trigger AI resume screening for a candidate.

    Called by a Supabase DB webhook when pipeline_stage = 'ai_screening_in_progress'.
    Returns 202 immediately; screening runs in a FastAPI BackgroundTask so the
    webhook gets a fast acknowledgement and the persistent Python process handles
    the actual Gemini call without any serverless timeout risk.
    """
    if not request.applicant_id or not request.job_post_id:
        raise HTTPException(status_code=400, detail="applicant_id and job_post_id are required")

    background_tasks.add_task(
        _run_screening,
        applicant_id=request.applicant_id,
        job_post_id=request.job_post_id,
    )

    return {"status": "accepted", "applicant_id": request.applicant_id}
