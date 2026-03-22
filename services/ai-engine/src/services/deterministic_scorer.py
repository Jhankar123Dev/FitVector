"""Deterministic fallback scorer — structured, explainable score using extracted data.

No LLM or embedding calls needed. Works on structured fields:
user skills, job required/nice-to-have skills, role types, experience years.

Scoring weights:
  - Required skills match ratio: 55%
  - Nice-to-have skills match ratio: 15%
  - Role alignment: 15%
  - Experience alignment: 15%
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("fitvector.deterministic_scorer")

# ─── Role alignment taxonomy ────────────────────────────────────────────────

# Related role groups — roles in the same group score 0.6 against each other
ROLE_GROUPS: dict[str, set[str]] = {
    "frontend": {"frontend", "frontend developer", "ui developer", "react developer", "web developer", "ui engineer", "frontend engineer"},
    "backend": {"backend", "backend developer", "server developer", "api developer", "backend engineer", "platform engineer"},
    "fullstack": {"fullstack", "full stack", "full-stack", "fullstack developer", "full stack developer", "software engineer", "software developer", "sde", "swe"},
    "data": {"data engineer", "data scientist", "data analyst", "ml engineer", "machine learning engineer", "analytics engineer", "bi analyst"},
    "devops": {"devops", "devops engineer", "sre", "site reliability", "platform engineer", "infrastructure engineer", "cloud engineer"},
    "mobile": {"mobile developer", "ios developer", "android developer", "react native developer", "flutter developer", "mobile engineer"},
    "ai": {"ai engineer", "ml engineer", "machine learning", "nlp engineer", "computer vision engineer", "deep learning engineer", "ai developer"},
    "product": {"product manager", "product owner", "program manager", "project manager", "technical pm"},
    "design": {"ui/ux designer", "ux designer", "product designer", "ui designer", "visual designer", "interaction designer"},
    "qa": {"qa engineer", "test engineer", "sdet", "quality assurance", "automation engineer", "qa analyst"},
}

# Adjacent groups — roles in adjacent groups score 0.6
ADJACENT_GROUPS: dict[str, list[str]] = {
    "frontend": ["fullstack", "mobile", "design"],
    "backend": ["fullstack", "devops", "data"],
    "fullstack": ["frontend", "backend", "devops"],
    "data": ["backend", "ai", "devops"],
    "devops": ["backend", "fullstack", "data"],
    "mobile": ["frontend", "fullstack"],
    "ai": ["data", "backend"],
    "product": ["design"],
    "design": ["frontend", "product"],
    "qa": ["fullstack", "backend", "frontend"],
}


def _normalize_role(role: str) -> str:
    """Lowercase and strip common suffixes."""
    return role.lower().strip()


def _find_role_group(role: str) -> str | None:
    """Find which role group a role belongs to."""
    normalized = _normalize_role(role)
    for group_name, members in ROLE_GROUPS.items():
        if normalized in members:
            return group_name
        # Partial match: if the normalized role contains a member keyword
        for member in members:
            if member in normalized or normalized in member:
                return group_name
    return None


# ─── Component scorers ──────────────────────────────────────────────────────


def _compute_required_skills_match(
    user_skills: list[str], required_skills: list[str]
) -> dict[str, Any]:
    """Required skills match ratio (55% weight)."""
    if not required_skills:
        return {
            "ratio": 1.0,
            "matched": [],
            "missing": [],
            "weight": 55,
        }

    user_lower = {s.lower() for s in user_skills}
    matched: list[str] = []
    missing: list[str] = []

    for skill in required_skills:
        if skill.lower() in user_lower:
            matched.append(skill)
        else:
            missing.append(skill)

    ratio = len(matched) / len(required_skills) if required_skills else 0.0

    return {
        "ratio": round(ratio, 3),
        "matched": matched,
        "missing": missing,
        "weight": 55,
    }


def _compute_optional_skills_match(
    user_skills: list[str], nice_to_have_skills: list[str]
) -> dict[str, Any]:
    """Nice-to-have skills match ratio (15% weight)."""
    if not nice_to_have_skills:
        return {
            "ratio": 1.0,
            "matched": [],
            "missing": [],
            "weight": 15,
        }

    user_lower = {s.lower() for s in user_skills}
    matched: list[str] = []
    missing: list[str] = []

    for skill in nice_to_have_skills:
        if skill.lower() in user_lower:
            matched.append(skill)
        else:
            missing.append(skill)

    ratio = len(matched) / len(nice_to_have_skills) if nice_to_have_skills else 0.0

    return {
        "ratio": round(ratio, 3),
        "matched": matched,
        "missing": missing,
        "weight": 15,
    }


def _compute_role_alignment(
    user_role: str | None, job_role: str | None
) -> dict[str, Any]:
    """Role alignment score (15% weight).

    Exact match → 1.0
    Related (same group or adjacent group) → 0.6
    Completely different → 0.3
    """
    if not user_role or not job_role:
        return {
            "score": 1.0,  # Default to 1.0 if role info is missing
            "user_role": user_role or "unknown",
            "job_role": job_role or "unknown",
            "weight": 15,
        }

    user_norm = _normalize_role(user_role)
    job_norm = _normalize_role(job_role)

    # Exact match
    if user_norm == job_norm:
        return {
            "score": 1.0,
            "user_role": user_role,
            "job_role": job_role,
            "weight": 15,
        }

    user_group = _find_role_group(user_norm)
    job_group = _find_role_group(job_norm)

    # Same group
    if user_group and user_group == job_group:
        return {
            "score": 1.0,
            "user_role": user_role,
            "job_role": job_role,
            "weight": 15,
        }

    # Adjacent groups
    if user_group and job_group:
        adjacents = ADJACENT_GROUPS.get(user_group, [])
        if job_group in adjacents:
            return {
                "score": 0.6,
                "user_role": user_role,
                "job_role": job_role,
                "weight": 15,
            }

    # Completely different
    return {
        "score": 0.3,
        "user_role": user_role,
        "job_role": job_role,
        "weight": 15,
    }


def _compute_experience_alignment(
    user_years: int | float | None, required_years: int | float | None
) -> dict[str, Any]:
    """Experience alignment score (15% weight).

    Meets or exceeds → 1.0
    1 year short → 0.75
    2 years short → 0.5
    3+ years short → 0.25
    Job doesn't specify → 1.0
    """
    if required_years is None or required_years <= 0:
        return {
            "score": 1.0,
            "user_years": user_years or 0,
            "required_years": 0,
            "shortfall": 0,
            "weight": 15,
        }

    actual_years = user_years or 0
    shortfall = max(0, required_years - actual_years)

    if shortfall <= 0:
        score = 1.0
    elif shortfall <= 1:
        score = 0.75
    elif shortfall <= 2:
        score = 0.5
    else:
        score = 0.25

    return {
        "score": score,
        "user_years": actual_years,
        "required_years": required_years,
        "shortfall": round(shortfall, 1),
        "weight": 15,
    }


# ─── Main scorer ────────────────────────────────────────────────────────────


def compute_deterministic_score(
    user_skills: list[str] | None = None,
    job_required_skills: list[str] | None = None,
    job_nice_to_have_skills: list[str] | None = None,
    user_role: str | None = None,
    job_role: str | None = None,
    user_experience_years: int | float | None = None,
    job_required_experience_years: int | float | None = None,
) -> dict[str, Any]:
    """Compute a deterministic, explainable match score.

    Returns:
        {
            "deterministic_score": 72,
            "components": {
                "required_skills_match": {..., "weight": 55},
                "optional_skills_match": {..., "weight": 15},
                "role_alignment": {..., "weight": 15},
                "experience_alignment": {..., "weight": 15}
            }
        }
    """
    # Handle edge cases — default empty arrays for missing lists
    user_skills = user_skills or []
    job_required_skills = job_required_skills or []
    job_nice_to_have_skills = job_nice_to_have_skills or []

    required_match = _compute_required_skills_match(user_skills, job_required_skills)
    optional_match = _compute_optional_skills_match(user_skills, job_nice_to_have_skills)
    role_align = _compute_role_alignment(user_role, job_role)
    experience_align = _compute_experience_alignment(
        user_experience_years, job_required_experience_years
    )

    # Final deterministic score = weighted sum
    deterministic_score = round(
        (required_match["ratio"] * 55)
        + (optional_match["ratio"] * 15)
        + (role_align["score"] * 15)
        + (experience_align["score"] * 15)
    )

    # Clamp to 0-100
    deterministic_score = max(0, min(100, deterministic_score))

    return {
        "deterministic_score": deterministic_score,
        "components": {
            "required_skills_match": required_match,
            "optional_skills_match": optional_match,
            "role_alignment": role_align,
            "experience_alignment": experience_align,
        },
    }


def score_to_decision_label(blended_score: int) -> str:
    """Map blended match score to a decision label.

    70-100 → apply_now
    50-69  → prepare_then_apply
    0-49   → explore
    """
    if blended_score >= 70:
        return "apply_now"
    elif blended_score >= 50:
        return "prepare_then_apply"
    else:
        return "explore"


def compute_blended_score(
    embedding_score: int | None,
    deterministic_score: int,
) -> int:
    """Compute blended score: 70% embedding + 30% deterministic.

    If embedding_score is None (e.g. free tier, no OpenAI key),
    falls back to 100% deterministic.
    """
    if embedding_score is None:
        return deterministic_score

    return round(embedding_score * 0.7 + deterministic_score * 0.3)
