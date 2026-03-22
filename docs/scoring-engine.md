# FitVector — Scoring Engine Specification

**Version:** 1.0
**Last Updated:** March 22, 2026
**Scope:** Match scoring, embedding pipeline, gap analysis

---

## 1. Overview

FitVector uses a two-tier scoring system to match job seekers with jobs:

- **Tier 1 — Embedding-based match score (cheap, fast, runs on every job-user pair):** Generates a 0-100 score using cosine similarity between user profile embeddings and job description embeddings.
- **Tier 2 — Claude-powered gap analysis (expensive, on-demand, Pro+ users only):** Detailed breakdown of skill matches, gaps, strengths, and actionable recommendations.

This design keeps costs under control while delivering meaningful personalization.

---

## 2. Tier 1 — Embedding-based match scoring

### 2.1 Embedding model

**Primary:** OpenAI `text-embedding-3-small`
- Dimensions: 1536
- Cost: $0.00002 per 1K tokens (~$0.02 per 1K embeddings)
- Latency: ~200ms per batch of 100

**Fallback (if cost becomes an issue at scale):** Hugging Face `all-MiniLM-L6-v2`
- Dimensions: 384
- Cost: free (self-hosted)
- Latency: ~50ms per batch of 100 (on CPU)
- Trade-off: slightly lower quality, but 95% as good for this use case

**Migration path:** Start with OpenAI for simplicity. If monthly embedding costs exceed $100, migrate to self-hosted MiniLM. The scoring pipeline is abstracted behind `EmbeddingService` class — swap model without changing any other code.

### 2.2 What gets embedded

**User profile embedding:**
```python
def build_user_text(profile: UserProfile) -> str:
    """Build a rich text representation of user's profile for embedding."""
    parts = []
    
    # Target roles (highest weight — this is what they're looking for)
    if profile.target_roles:
        parts.append(f"Target roles: {', '.join(profile.target_roles)}")
    
    # Skills (core matching signal)
    if profile.skills:
        parts.append(f"Skills: {', '.join(profile.skills)}")
    
    # Experience summary (context for skill depth)
    if profile.parsed_resume_json:
        for exp in profile.parsed_resume_json.get("experience", [])[:3]:  # Last 3 roles
            role_text = f"{exp['role']} at {exp['company']}"
            if exp.get("bullets"):
                role_text += ". " + ". ".join(exp["bullets"][:3])  # Top 3 bullets
            parts.append(role_text)
    
    # Education (minor signal)
    if profile.parsed_resume_json:
        for edu in profile.parsed_resume_json.get("education", [])[:1]:
            parts.append(f"{edu['degree']} in {edu.get('field', 'N/A')} from {edu['institution']}")
    
    # Experience level
    if profile.experience_level:
        parts.append(f"Experience level: {profile.experience_level}")
    
    return "\n".join(parts)
```

**Job embedding:**
```python
def build_job_text(job: Job) -> str:
    """Build text representation of job for embedding."""
    parts = []
    
    parts.append(f"Job title: {job.title}")
    
    if job.skills_required:
        parts.append(f"Required skills: {', '.join(job.skills_required)}")
    
    if job.skills_nice_to_have:
        parts.append(f"Nice to have: {', '.join(job.skills_nice_to_have)}")
    
    # Use first 500 words of description (captures key responsibilities)
    if job.description:
        desc_words = job.description.split()[:500]
        parts.append(" ".join(desc_words))
    
    if job.experience_min is not None:
        parts.append(f"Experience: {job.experience_min}-{job.experience_max or '+'} years")
    
    return "\n".join(parts)
```

### 2.3 Embedding generation pipeline

**When embeddings are generated:**

| Event | Action |
|-------|--------|
| User completes onboarding (uploads resume) | Generate user embedding |
| User updates profile or re-uploads resume | Re-generate user embedding, invalidate all match scores |
| New jobs scraped (daily cron) | Generate job embeddings for new jobs |
| Job description updated (re-scrape detects change) | Re-generate job embedding |

**Batch processing:**
```python
async def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a batch of texts. Max 100 per batch."""
    response = await openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=texts[:100]  # API limit
    )
    return [item.embedding for item in response.data]
```

**Storage:** Embeddings stored in PostgreSQL using pgvector extension.

### 2.4 Match score calculation

```python
async def compute_match_score(user_id: str, job_id: str) -> MatchResult:
    """Compute match score between a user and a job."""
    
    # Fetch embeddings
    user_embedding = await db.get_user_embedding(user_id)
    job_embedding = await db.get_job_embedding(job_id)
    
    if not user_embedding or not job_embedding:
        return MatchResult(score=0, bucket="weak_fit", similarity_raw=0.0)
    
    # Cosine similarity via pgvector
    similarity = cosine_similarity(user_embedding, job_embedding)
    
    # Map to 0-100 score with calibrated thresholds
    score = similarity_to_score(similarity)
    
    # Determine bucket
    bucket = score_to_bucket(score)
    
    return MatchResult(
        score=score,
        bucket=bucket,
        similarity_raw=round(similarity, 4)
    )
```

### 2.5 Score calibration

Raw cosine similarity values from embedding models don't map linearly to "fit quality." Calibration converts raw similarity to a human-meaningful 0-100 score.

```python
def similarity_to_score(similarity: float) -> int:
    """
    Convert cosine similarity to 0-100 match score.
    
    Calibration based on empirical testing:
    - Exact same JD vs resume: ~0.85-0.95 similarity
    - Strong match (right role, right skills): ~0.65-0.85
    - Decent match (related role, some skills overlap): ~0.45-0.65
    - Weak match (different domain): ~0.25-0.45
    - No match: < 0.25
    
    We use a piecewise linear mapping to spread the "interesting" range
    (0.45-0.85) across most of the 0-100 score range.
    """
    if similarity >= 0.85:
        return 95 + int((similarity - 0.85) / 0.15 * 5)  # 95-100
    elif similarity >= 0.65:
        return 75 + int((similarity - 0.65) / 0.20 * 20)  # 75-95
    elif similarity >= 0.50:
        return 55 + int((similarity - 0.50) / 0.15 * 20)  # 55-75
    elif similarity >= 0.35:
        return 30 + int((similarity - 0.35) / 0.15 * 25)  # 30-55
    elif similarity >= 0.20:
        return 10 + int((similarity - 0.20) / 0.15 * 20)  # 10-30
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
```

### 2.6 Calibration tuning

These thresholds should be tuned after launch based on real data:

**Method:**
1. Collect 100 user-job pairs where users actually applied and got interviews
2. Collect 100 pairs where users applied and got rejected
3. Plot cosine similarity distributions for both groups
4. Adjust breakpoints so that "strong_fit" (80+) captures most of the interview group and "weak_fit" (<40) captures most of the rejection group
5. Re-run calibration quarterly as user base grows

**A/B test:** Show half of users raw similarity as score, half the calibrated score. Measure which leads to more applications on "strong_fit" jobs.

### 2.7 Bulk matching (daily cron)

```python
async def daily_match_job():
    """
    Runs at 3:00 AM IST daily.
    Computes match scores for all active users against newly scraped jobs.
    """
    # Get all users with embeddings
    users = await db.get_users_with_embeddings()
    
    # Get jobs scraped in last 24 hours
    new_jobs = await db.get_jobs_scraped_since(hours=24)
    
    if not new_jobs:
        return
    
    for user in users:
        # Use pgvector similarity search for efficiency
        # This uses the IVFFlat index — much faster than brute force
        top_matches = await db.query("""
            SELECT j.id, 1 - (j.embedding <=> $1) AS similarity
            FROM jobs j
            WHERE j.is_active = true
              AND j.scraped_at > NOW() - INTERVAL '24 hours'
              AND NOT EXISTS (
                  SELECT 1 FROM job_matches jm 
                  WHERE jm.user_id = $2 AND jm.job_id = j.id
              )
            ORDER BY j.embedding <=> $1
            LIMIT 50
        """, user.embedding, user.id)
        
        # Insert match scores
        for match in top_matches:
            score = similarity_to_score(match.similarity)
            if score >= 30:  # Don't store weak matches (saves space)
                await db.insert_job_match(
                    user_id=user.id,
                    job_id=match.id,
                    match_score=score,
                    match_bucket=score_to_bucket(score),
                    similarity_raw=match.similarity
                )
    
    logger.info(f"Daily match: processed {len(users)} users × {len(new_jobs)} new jobs")
```

### 2.8 Performance targets

| Operation | Target | Method |
|-----------|--------|--------|
| Single user-job score | < 50ms | Direct pgvector cosine similarity |
| User's top 50 matches | < 200ms | pgvector IVFFlat index scan |
| Batch: 1K users × 100 new jobs | < 5 minutes | Parallel pgvector queries, 10 users/batch |
| Embedding generation (100 texts) | < 500ms | OpenAI batch API call |

### 2.9 Caching strategy

| Data | Cache | TTL | Invalidation |
|------|-------|-----|--------------|
| User embedding | PostgreSQL (pgvector) | Permanent | Re-generated on profile update |
| Job embedding | PostgreSQL (pgvector) | Permanent | Re-generated if JD changes |
| Match scores | PostgreSQL (job_matches table) | 7 days | Invalidated on user profile update |
| Match scores | Redis (hot cache) | 1 hour | On new matches computed |
| Calibration thresholds | Application config | Permanent | Manual update via config |

---

## 3. Tier 2 — Claude-powered gap analysis

### 3.1 When it's triggered

- User explicitly clicks "AI Gap Analysis" on a job detail page
- Only available on Pro and Elite plans
- Pro: 20 analyses/month, Elite: unlimited

### 3.2 Prompt design

```python
GAP_ANALYSIS_SYSTEM_PROMPT = """You are an expert career advisor and technical recruiter. 
Analyze how well this candidate's profile matches a specific job description.

Provide a structured analysis with these exact sections:

1. MATCHING SKILLS: List skills from the candidate's profile that match the job requirements. 
   For each, cite specific evidence from their experience (company name, project, metric).

2. MISSING SKILLS: List skills required by the job that the candidate lacks. 
   Rate each as "critical" (must-have), "important" (strong preference), or "nice-to-have".

3. EXPERIENCE GAPS: Identify areas where the candidate's experience falls short. 
   Be specific (e.g., "No experience with teams larger than 5" or "No exposure to B2B SaaS").

4. STRENGTHS: Top 3 things that make this candidate stand out for this role. 
   Focus on unique differentiators, not just skill matches.

5. RECOMMENDATIONS: 3-5 actionable steps the candidate can take to improve their fit. 
   Be specific and practical (e.g., "Complete X course" or "Add Y project to portfolio").

Be constructive and encouraging, not discouraging. Frame gaps as growth opportunities.
Respond in JSON format matching the schema below."""

GAP_ANALYSIS_USER_TEMPLATE = """
Candidate Profile:
{profile_json}

Job Description:
Title: {job_title}
Company: {company_name}
Description: {job_description}
Required Skills: {skills_required}
Experience Required: {experience_range}

Provide your analysis as JSON:
{{
  "matchingSkills": [{{"skill": "string", "evidence": "string"}}],
  "missingSkills": [{{"skill": "string", "importance": "critical|important|nice_to_have"}}],
  "experienceGaps": ["string"],
  "strengths": ["string"],
  "recommendations": ["string"]
}}
"""
```

### 3.3 Implementation

```python
async def generate_gap_analysis(user_id: str, job_id: str) -> GapAnalysis:
    """Generate detailed gap analysis using Claude."""
    
    # Check cache first
    cached = await redis.get(f"gap:{user_id}:{job_id}")
    if cached:
        return GapAnalysis.parse_raw(cached)
    
    # Fetch data
    profile = await db.get_user_profile(user_id)
    job = await db.get_job(job_id)
    
    # Call Claude
    response = await anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system=GAP_ANALYSIS_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": GAP_ANALYSIS_USER_TEMPLATE.format(
                profile_json=json.dumps(profile.parsed_resume_json, indent=2),
                job_title=job.title,
                company_name=job.company_name,
                job_description=job.description[:3000],  # Limit to control token usage
                skills_required=", ".join(job.skills_required),
                experience_range=f"{job.experience_min}-{job.experience_max} years"
            )
        }]
    )
    
    # Parse JSON response
    analysis = parse_gap_analysis_response(response.content[0].text)
    
    # Cache for 7 days
    await redis.setex(
        f"gap:{user_id}:{job_id}",
        timedelta(days=7),
        analysis.json()
    )
    
    # Store in database
    await db.update_job_match(
        user_id=user_id,
        job_id=job_id,
        gap_analysis=analysis.dict(),
        gap_analysis_generated_at=datetime.utcnow()
    )
    
    return analysis
```

### 3.4 Cost analysis

| Model | Input tokens (avg) | Output tokens (avg) | Cost per call | Monthly cost (1K calls) |
|-------|-------------------|---------------------|---------------|------------------------|
| Claude Sonnet | ~2,500 | ~800 | ~$0.012 | ~$12 |
| Claude Haiku (fallback) | ~2,500 | ~800 | ~$0.002 | ~$2 |

**Strategy:** Use Sonnet for quality. If costs spike, downgrade to Haiku for Starter-equivalent analysis and reserve Sonnet for Pro/Elite.

---

## 4. Skill extraction from JDs

When jobs are scraped, skills need to be extracted from the description text for the skills match visualization.

### 4.1 Approach: Keyword-based + LLM fallback

**Step 1 — Keyword matching (fast, free):**
```python
SKILL_TAXONOMY = {
    # Programming languages
    "python", "javascript", "typescript", "java", "go", "rust", "c++", "ruby", "php", "swift", "kotlin",
    # Frontend
    "react", "vue", "angular", "next.js", "svelte", "html", "css", "tailwind",
    # Backend
    "node.js", "express", "fastapi", "django", "flask", "spring boot", "rails",
    # Databases
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb",
    # Cloud
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform",
    # Data
    "pandas", "numpy", "spark", "kafka", "airflow", "dbt",
    # ML/AI
    "tensorflow", "pytorch", "scikit-learn", "llm", "nlp", "computer vision",
    # Tools
    "git", "ci/cd", "jenkins", "github actions", "figma", "jira",
    # Concepts
    "system design", "microservices", "rest api", "graphql", "agile", "scrum",
    # ... 200+ more skills
}

def extract_skills_keyword(description: str) -> list[str]:
    """Fast keyword-based skill extraction."""
    description_lower = description.lower()
    found = []
    for skill in SKILL_TAXONOMY:
        if skill in description_lower:
            found.append(skill)
    return found
```

**Step 2 — LLM extraction (for skills not in taxonomy):**
Only triggered if keyword extraction finds < 3 skills (suggests unusual JD format).

```python
async def extract_skills_llm(description: str) -> list[str]:
    """LLM-based skill extraction for edge cases."""
    response = await anthropic_client.messages.create(
        model="claude-haiku-4-5-20251001",  # Cheapest model, sufficient for extraction
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": f"Extract all technical skills, tools, and technologies mentioned in this job description. Return as a JSON array of strings, lowercase.\n\n{description[:2000]}"
        }]
    )
    return json.loads(response.content[0].text)
```

### 4.2 Skills match visualization data

```python
def compute_skill_match(user_skills: list[str], job_skills: list[str]) -> SkillMatch:
    """Compute skill overlap for visualization."""
    user_set = set(s.lower() for s in user_skills)
    job_set = set(s.lower() for s in job_skills)
    
    return SkillMatch(
        matching=sorted(user_set & job_set),        # Green: user has + job needs
        missing=sorted(job_set - user_set),          # Red: job needs + user lacks
        extra=sorted(user_set - job_set)[:10]        # Gray: user has + job doesn't list (cap at 10)
    )
```

---

## 5. Match score display rules

### 5.1 What users see per plan

| Plan | Search results | Job detail | Gap analysis |
|------|---------------|------------|--------------|
| Free | No score shown | No score shown | Locked |
| Starter | Score badge (number only) | Score badge + skill match viz | Locked |
| Pro | Score badge + bucket label | Score + skill match + gap analysis button | 20/month |
| Elite | Score badge + bucket label | Score + skill match + gap analysis | Unlimited |

### 5.2 Score badge design

```
Score 80-100: Green badge, "Strong fit"
Score 60-79:  Blue badge, "Good fit"
Score 40-59:  Yellow badge, "Potential fit"
Score 0-39:   Gray badge, "Explore" (never say "weak" or "bad" to user)
```

### 5.3 Sorting and filtering

- Default sort: match score descending (highest match first)
- Users can switch to: date posted, salary (high to low), company name
- Filter by bucket: "Show only Strong fit and Good fit"
- Dismissed jobs are hidden from feed but can be recovered via "Dismissed" tab

---

## 6. Future enhancements (not in Phase 1)

### 6.1 Behavioral scoring signals (Phase 2+)
- Jobs where the user applied and got interviews → positive signal for similar jobs
- Jobs where the user was rejected → negative signal (lower score for similar JDs)
- Resume versions that led to callbacks → boost similar tailoring patterns
- Over time, the scoring model becomes personalized per user

### 6.2 Collaborative filtering (Phase 3)
- "Users similar to you got hired at these companies"
- Requires minimum user base (~5K active users) to be statistically meaningful
- Implementation: matrix factorization on user-job interaction data

### 6.3 Employer feedback loop (Phase 2+)
- When employers rate candidates on FitVector, that data refines the scoring model
- A candidate who scores 90 but gets rejected by 5 employers → scoring may be miscalibrated for that skill combination
- This is FitVector's long-term data moat

---

*This scoring engine is designed to be cheap at scale (embedding-based) while delivering genuine insight when users invest attention (Claude-powered analysis). The abstraction layers allow swapping models without changing application code.*
