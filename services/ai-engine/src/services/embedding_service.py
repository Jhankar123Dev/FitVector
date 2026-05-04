"""Embedding generation and match scoring service.

Uses Google text-embedding-004 (768-dim) for vector embeddings
and cosine similarity for match scoring with calibrated thresholds.

Blended scoring: 70% embedding + 30% deterministic.
"""

from __future__ import annotations

import json
import logging
import math
from typing import Any

from src.config import settings
from src.models.scoring import (
    DeterministicComponents,
    ExperienceAlignmentComponent,
    GapAnalysisRequest,
    GapAnalysisResponse,
    GapAnalysisMatchingSkill,
    GapAnalysisMissingSkill,
    MatchScoreRequest,
    MatchScoreResponse,
    RoleAlignmentComponent,
    SkillMatchComponent,
    SkillMatchResponse,
)
from src.services.ai_service import _call_gemini, _clean_gemini_json_response
from src.services.deterministic_scorer import (
    compute_blended_score,
    compute_deterministic_score,
    score_to_decision_label,
)
from src.utils.text import truncate_words

logger = logging.getLogger("fitvector.embedding")

# ─── Embedding generation (Gemini embedding API) ────────────────────────────

_EMBEDDING_MODEL = "text-embedding-004"


async def generate_embedding(text: str) -> list[float]:
    """Generate a single embedding vector using Gemini embedding API."""
    from google import genai

    client = genai.Client(api_key=settings.gemini_api_key)
    result = client.models.embed_content(
        model=_EMBEDDING_MODEL,
        contents=text,
    )
    return result.embeddings[0].values


async def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a batch of texts using Gemini embedding API."""
    if not texts:
        return []
    results = []
    for text in texts:
        emb = await generate_embedding(text)
        results.append(emb)
    return results


# ─── Text builders (from scoring-engine spec) ───────────────────────────────


def build_user_text(profile: dict[str, Any]) -> str:
    """Build a rich text representation of user's profile for embedding."""
    parts: list[str] = []

    target_roles = profile.get("target_roles") or profile.get("targetRoles") or []
    if target_roles:
        parts.append(f"Target roles: {', '.join(target_roles)}")

    skills = profile.get("skills") or []
    if skills:
        parts.append(f"Skills: {', '.join(skills)}")

    parsed = profile.get("parsed_resume_json") or profile.get("parsedResumeJson") or {}
    for exp in (parsed.get("experience") or [])[:3]:
        role_text = f"{exp.get('role', '')} at {exp.get('company', '')}"
        bullets = exp.get("bullets") or []
        if bullets:
            role_text += ". " + ". ".join(bullets[:3])
        parts.append(role_text)

    for edu in (parsed.get("education") or [])[:1]:
        parts.append(
            f"{edu.get('degree', '')} in {edu.get('field', 'N/A')} "
            f"from {edu.get('institution', '')}"
        )

    exp_level = profile.get("experience_level") or profile.get("experienceLevel")
    if exp_level:
        parts.append(f"Experience level: {exp_level}")

    return "\n".join(parts)


def build_job_text(job: dict[str, Any]) -> str:
    """Build text representation of job for embedding."""
    parts: list[str] = []

    parts.append(f"Job title: {job.get('title', '')}")

    skills_req = job.get("skills_required") or job.get("skillsRequired") or []
    if skills_req:
        parts.append(f"Required skills: {', '.join(skills_req)}")

    skills_nice = job.get("skills_nice_to_have") or job.get("skillsNiceToHave") or []
    if skills_nice:
        parts.append(f"Nice to have: {', '.join(skills_nice)}")

    description = job.get("description") or ""
    if description:
        parts.append(truncate_words(description, 500))

    exp_min = job.get("experience_min") or job.get("experienceMin")
    exp_max = job.get("experience_max") or job.get("experienceMax")
    if exp_min is not None:
        parts.append(f"Experience: {exp_min}-{exp_max or '+'} years")

    return "\n".join(parts)


# ─── Cosine similarity ──────────────────────────────────────────────────────


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


# ─── Score calibration (from scoring-engine spec) ───────────────────────────


def similarity_to_score(similarity: float) -> int:
    """Convert cosine similarity to 0-100 match score with calibrated thresholds."""
    if similarity >= 0.85:
        return 95 + int((similarity - 0.85) / 0.15 * 5)   # 95-100
    elif similarity >= 0.65:
        return 75 + int((similarity - 0.65) / 0.20 * 20)   # 75-95
    elif similarity >= 0.50:
        return 55 + int((similarity - 0.50) / 0.15 * 20)   # 55-75
    elif similarity >= 0.35:
        return 30 + int((similarity - 0.35) / 0.15 * 25)   # 30-55
    elif similarity >= 0.20:
        return 10 + int((similarity - 0.20) / 0.15 * 20)   # 10-30
    else:
        return max(0, int(similarity / 0.20 * 10))          # 0-10


def score_to_bucket(score: int) -> str:
    """Map score to human-readable bucket."""
    if score >= 80:
        return "strong_fit"
    elif score >= 60:
        return "good_fit"
    elif score >= 40:
        return "potential_fit"
    else:
        return "weak_fit"


# ─── Skill match computation ────────────────────────────────────────────────


def compute_skill_match(
    user_skills: list[str], job_skills: list[str]
) -> SkillMatchResponse:
    """Compute skill overlap for visualization."""
    user_set = {s.lower() for s in user_skills}
    job_set = {s.lower() for s in job_skills}

    return SkillMatchResponse(
        matching=sorted(user_set & job_set),
        missing=sorted(job_set - user_set),
        extra=sorted(user_set - job_set)[:10],
    )


# ─── Blended match score computation ────────────────────────────────────────


async def compute_match_score(request: MatchScoreRequest) -> MatchScoreResponse:
    """Compute blended match score: 70% embedding + 30% deterministic.

    Accepts either pre-computed embeddings or raw text (generates embeddings on the fly).
    Also accepts structured fields for deterministic scoring.
    """
    # ── Step 1: Embedding score ──────────────────────────────────────────
    user_emb = request.user_embedding
    job_emb = request.job_embedding
    embedding_score: int | None = None
    sim = 0.0

    if user_emb is None and request.user_text:
        try:
            user_emb = await generate_embedding(request.user_text)
        except Exception as exc:
            logger.warning("Failed to generate user embedding: %s", exc)

    if job_emb is None and request.job_text:
        try:
            job_emb = await generate_embedding(request.job_text)
        except Exception as exc:
            logger.warning("Failed to generate job embedding: %s", exc)

    if user_emb and job_emb:
        sim = cosine_similarity(user_emb, job_emb)
        embedding_score = similarity_to_score(sim)

    # ── Step 2: Deterministic score ──────────────────────────────────────
    det_result = compute_deterministic_score(
        user_skills=request.user_skills,
        job_required_skills=request.job_required_skills,
        job_nice_to_have_skills=request.job_nice_to_have_skills,
        user_role=request.user_role,
        job_role=request.job_role,
        user_experience_years=request.user_experience_years,
        job_required_experience_years=request.job_required_experience_years,
    )
    deterministic_score = det_result["deterministic_score"]
    components = det_result["components"]

    # ── Step 3: Blend ────────────────────────────────────────────────────
    blended = compute_blended_score(embedding_score, deterministic_score)
    bucket = score_to_bucket(blended)
    decision_label = score_to_decision_label(blended)

    # Build typed components
    det_components = DeterministicComponents(
        required_skills_match=SkillMatchComponent(**components["required_skills_match"]),
        optional_skills_match=SkillMatchComponent(**components["optional_skills_match"]),
        role_alignment=RoleAlignmentComponent(**components["role_alignment"]),
        experience_alignment=ExperienceAlignmentComponent(**components["experience_alignment"]),
    )

    return MatchScoreResponse(
        match_score=blended,
        match_bucket=bucket,
        decision_label=decision_label,
        similarity_raw=round(sim, 4),
        embedding_score=embedding_score,
        deterministic_score=deterministic_score,
        deterministic_components=det_components,
    )


# ─── Gap analysis (Claude-powered) ──────────────────────────────────────────

GAP_ANALYSIS_SYSTEM_PROMPT = """You are an expert career advisor and technical recruiter.
Analyze how well this candidate's profile matches a specific job description.

Provide a structured analysis with these exact sections:

1. MATCHING SKILLS: List skills from the candidate's profile that match the job requirements.
   For each, cite specific evidence from their experience (company name, project, metric).

2. MISSING SKILLS: List skills required by the job that the candidate lacks.
   Rate each as "critical" (must-have), "important" (strong preference), or "nice_to_have".

3. EXPERIENCE GAPS: Identify areas where the candidate's experience falls short.
   Be specific (e.g., "No experience with teams larger than 5" or "No exposure to B2B SaaS").

4. STRENGTHS: Top 3 things that make this candidate stand out for this role.
   Focus on unique differentiators, not just skill matches.

5. RECOMMENDATIONS: 3-5 actionable steps the candidate can take to improve their fit.
   Be specific and practical (e.g., "Complete X course" or "Add Y project to portfolio").

Be constructive and encouraging, not discouraging. Frame gaps as growth opportunities.
Respond ONLY with valid JSON matching the schema below — no markdown, no extra text."""


async def generate_gap_analysis(request: GapAnalysisRequest) -> GapAnalysisResponse:
    """Generate detailed gap analysis using Gemini Flash."""
    try:
        user_prompt = f"""Candidate Profile:
{json.dumps(request.parsed_resume, indent=2)}

Job Description:
Title: {request.job_title}
Company: {request.company_name}
Description: {truncate_words(request.job_description, 600)}
Required Skills: {', '.join(request.skills_required)}
Experience Required: {request.experience_range}

Provide your analysis as JSON:
{{
  "matchingSkills": [{{"skill": "string", "evidence": "string"}}],
  "missingSkills": [{{"skill": "string", "importance": "critical|important|nice_to_have"}}],
  "experienceGaps": ["string"],
  "strengths": ["string"],
  "recommendations": ["string"]
}}"""

        raw_text = await _call_gemini(
            task="generate_gap_analysis",
            system_prompt=GAP_ANALYSIS_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=2000,
            response_mime_type="application/json",
        )
        clean = _clean_gemini_json_response(raw_text)
        if not clean:
            raise ValueError("Gemini returned empty response for gap analysis")
        parsed = json.loads(clean)

        return GapAnalysisResponse(
            matching_skills=[
                GapAnalysisMatchingSkill(**s) for s in parsed.get("matchingSkills", [])
            ],
            missing_skills=[
                GapAnalysisMissingSkill(**s) for s in parsed.get("missingSkills", [])
            ],
            experience_gaps=parsed.get("experienceGaps", []),
            strengths=parsed.get("strengths", []),
            recommendations=parsed.get("recommendations", []),
        )
    except Exception as exc:
        logger.error("Gap analysis failed: %s", exc)
        return GapAnalysisResponse(
            matching_skills=[],
            missing_skills=[],
            experience_gaps=[],
            strengths=[],
            recommendations=[f"Analysis could not be completed: {str(exc)}"],
        )
