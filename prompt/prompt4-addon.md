# Prompt 4 Addon — Deterministic Scoring + Decision Labels + Skill Insights

> Paste this in the SAME chat where you ran Prompt 4, AFTER the job search and embedding scorer are working. Attach `scoring-engine-spec.md` and `api-contracts.md`.

---
https://github.com/speedyapply/JobSpy
Continuing FitVector build. The embedding-based match scoring is working. Now I want to add three additional features to make scoring more explainable and actionable. These are inspired by a prototype scoring engine I previously built.

**Task A: Deterministic fallback scorer**

Create a new file `services/ai-engine/src/services/deterministic_scorer.py` that computes a structured, explainable score using extracted data (no LLM or embedding calls needed).

The scorer should work on structured fields: user skills array, job required_skills array, job nice_to_have_skills array, user role type, job role type, user experience years, job required experience years.

Scoring formula with weights:
- Required skills match ratio: 55% weight. Count how many of the job's required_skills appear in the user's skills list (case-insensitive). Ratio = matched / total required.
- Nice-to-have skills match ratio: 15% weight. Same logic but against nice_to_have_skills.
- Role alignment: 15% weight. If user's primary role type matches the job's role type exactly → 1.0. If different but related (e.g., "backend" vs "ai-adjacent") → 0.6. If completely different → 0.3.
- Experience alignment: 15% weight. If user meets or exceeds required years → 1.0. If 1 year short → 0.75. If 2 years short → 0.5. If 3+ years short → 0.25. If job doesn't specify experience → 1.0.

Final deterministic score = (required_ratio × 55) + (optional_ratio × 15) + (role_score × 15) + (experience_score × 15).

The function should return:
```python
{
    "deterministic_score": 72,
    "components": {
        "required_skills_match": {"ratio": 0.85, "matched": ["React", "TypeScript"], "missing": ["GraphQL"], "weight": 55},
        "optional_skills_match": {"ratio": 0.5, "matched": ["Docker"], "missing": ["AWS"], "weight": 15},
        "role_alignment": {"score": 1.0, "user_role": "backend", "job_role": "backend", "weight": 15},
        "experience_alignment": {"score": 0.75, "user_years": 2, "required_years": 3, "shortfall": 1, "weight": 15}
    }
}
```

Now update the match scoring pipeline so the FINAL match score is a blend:
- `blended_score = (embedding_score × 0.7) + (deterministic_score × 0.3)`
- Store both individual scores in the job_matches table for debugging
- Display only the blended score to the user

The deterministic scorer also provides the skill match/miss breakdown that powers the job detail view's skill visualization — use its `matched` and `missing` arrays directly instead of computing them separately.

**Task B: Decision labels on job cards**

Based on the blended match score, assign a decision label to every job match:
- Score 70-100 → `"apply_now"` — display as green badge "Apply now"
- Score 50-69 → `"prepare_then_apply"` — display as yellow badge "Prepare & apply"
- Score 0-49 → `"explore"` — display as gray badge "Explore"

Never show "skip" or "weak" or any negative language to users.

Add this label to:
1. The `job_matches` database table as a new column `decision_label` (text, enum: apply_now, prepare_then_apply, explore)
2. The job card component in the search results — show the badge next to the match score
3. The job detail page header
4. The GET /api/jobs/search and GET /api/jobs/matches API responses

Also add filter capability: user can filter job results by decision label (e.g., "Show only Apply Now jobs").

**Task C: "Skills to learn" insight in tracker analytics**

When a user has 5 or more jobs in their application tracker, compute a "skills to learn" analysis.

Logic:
1. Collect all jobs from the user's tracker (any status except "withdrawn")
2. For each job, get its required_skills and nice_to_have_skills (from the jobs table)
3. Compare against the user's skills array
4. For each missing skill, calculate a priority score:
   - Base score: +3 per job that requires it as a required skill
   - Bonus: +1 per job that lists it as nice-to-have
   - Bonus: +2 for each "prepare_then_apply" job that needs this skill (learning it would flip them to "apply_now")
5. Sort by priority score descending
6. Return top 5 skills

Add this to the GET /api/tracker/analytics endpoint response:
```json
{
  "skillsToLearn": [
    {
      "skill": "GraphQL",
      "priorityScore": 14,
      "requiredIn": 4,
      "niceToHaveIn": 2,
      "wouldUnlock": 3,
      "message": "Learning GraphQL would improve your fit for 4 saved jobs and could unlock 3 more applications"
    },
    {
      "skill": "System Design",
      "priorityScore": 11,
      "requiredIn": 3,
      "niceToHaveIn": 2,
      "wouldUnlock": 2,
      "message": "Learning System Design would improve your fit for 3 saved jobs and could unlock 2 more applications"
    }
  ]
}
```

Build a simple "Skills to Learn" card in the tracker analytics dashboard that displays these top 5 skills with their impact messages. Use a clean card layout with a graduation cap or lightbulb icon, the skill name prominent, and the message as subtitle text.

**Important implementation notes:**
- The deterministic scorer must handle edge cases: empty skills arrays, missing experience data, null role types. Default to 0 for missing numeric fields and empty arrays for missing lists.
- Skill matching must be case-insensitive. "React" should match "react" and "REACT".
- The skills-to-learn computation should be cached in Redis with a 1-hour TTL, invalidated when user adds/removes tracker entries or updates their profile.
- All three features should work on all plan tiers (including free). These are not premium-gated — they make the core product better for everyone.
