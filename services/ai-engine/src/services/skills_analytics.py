"""Skills-to-learn analytics — computes priority skills for users with 5+ tracked jobs.

Logic:
1. Collect all jobs from tracker (any status except withdrawn)
2. For each job, get required_skills and nice_to_have_skills
3. Compare against user's skills
4. For each missing skill, calculate priority:
   - +3 per job that requires it
   - +1 per job that lists it as nice-to-have
   - +2 per "prepare_then_apply" job that needs it (learning would flip to apply_now)
5. Sort descending, return top 5
"""

from __future__ import annotations

import logging
from collections import defaultdict
from typing import Any

from src.models.scoring import SkillToLearn, SkillsToLearnResponse

logger = logging.getLogger("fitvector.skills_analytics")


def compute_skills_to_learn(
    user_skills: list[str],
    tracker_jobs: list[dict[str, Any]],
) -> SkillsToLearnResponse:
    """Compute top 5 priority skills to learn based on tracker jobs.

    Each job dict should contain:
      - required_skills: list[str]
      - nice_to_have_skills: list[str]  (optional)
      - decision_label: str  (apply_now, prepare_then_apply, explore)
    """
    if len(tracker_jobs) < 5:
        return SkillsToLearnResponse(skills_to_learn=[])

    user_skills_lower = {s.lower() for s in user_skills}

    # Track per-skill stats
    required_count: dict[str, int] = defaultdict(int)
    nice_count: dict[str, int] = defaultdict(int)
    would_unlock_count: dict[str, int] = defaultdict(int)

    for job in tracker_jobs:
        required = job.get("required_skills") or job.get("skills_required") or []
        nice_to_have = job.get("nice_to_have_skills") or job.get("skills_nice_to_have") or []
        decision_label = job.get("decision_label") or "explore"

        for skill in required:
            skill_lower = skill.lower()
            if skill_lower not in user_skills_lower:
                required_count[skill_lower] += 1
                # Learning this skill on a prepare_then_apply job could flip it to apply_now
                if decision_label == "prepare_then_apply":
                    would_unlock_count[skill_lower] += 1

        for skill in nice_to_have:
            skill_lower = skill.lower()
            if skill_lower not in user_skills_lower:
                nice_count[skill_lower] += 1

    # Compute priority scores
    all_missing_skills = set(required_count.keys()) | set(nice_count.keys())
    skill_priorities: list[tuple[str, int, int, int, int]] = []

    for skill in all_missing_skills:
        req = required_count.get(skill, 0)
        nice = nice_count.get(skill, 0)
        unlock = would_unlock_count.get(skill, 0)

        priority = (req * 3) + (nice * 1) + (unlock * 2)
        skill_priorities.append((skill, priority, req, nice, unlock))

    # Sort by priority descending
    skill_priorities.sort(key=lambda x: x[1], reverse=True)

    # Take top 5
    top_5 = skill_priorities[:5]

    result: list[SkillToLearn] = []
    for skill, priority, req, nice, unlock in top_5:
        # Build human-readable message
        parts: list[str] = []
        if req > 0:
            parts.append(f"improve your fit for {req} saved job{'s' if req != 1 else ''}")
        if unlock > 0:
            parts.append(f"could unlock {unlock} more application{'s' if unlock != 1 else ''}")

        message = f"Learning {skill.title()} would {' and '.join(parts)}" if parts else ""

        result.append(
            SkillToLearn(
                skill=skill.title(),
                priority_score=priority,
                required_in=req,
                nice_to_have_in=nice,
                would_unlock=unlock,
                message=message,
            )
        )

    return SkillsToLearnResponse(skills_to_learn=result)
