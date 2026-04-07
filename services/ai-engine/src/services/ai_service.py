"""AI-powered services: resume tailoring, parsing, and outreach generation.

Resume: user profile JSON + JD text → Gemini API → LaTeX source → Tectonic PDF → Supabase upload.
Parse: raw PDF/DOCX bytes → PyMuPDF/python-docx → Gemini Flash → structured JSON.
Outreach: user profile + job → Gemini API → cold email / LinkedIn msg / referral request.
"""

from __future__ import annotations

import io
import json
import logging
import re
import time
from datetime import datetime
from typing import Any

from google import genai
from google.genai import types as genai_types
from json_repair import repair_json
from pydantic import BaseModel

from src.config import settings
from src.models.resume import ParseResumeResponse, TailorResumeRequest, TailorResumeResponse
from src.prompts.resume_tailor import (
    DEFAULT_LATEX_TEMPLATE,
    RESUME_TAILOR_SYSTEM_PROMPT,
)

logger = logging.getLogger("fitvector.ai_service")

# ─── Gemini client (singleton) ───────────────────────────────────────────────

_gemini_client: genai.Client | None = None


def _get_gemini() -> genai.Client:
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = genai.Client(api_key=settings.gemini_api_key)
    return _gemini_client


def get_model_for_task(task: str) -> str:
    """Select Gemini model for task. Uses gemini-2.5-flash for all tasks (free-tier safe)."""
    return "gemini-2.5-flash"


async def _call_gemini(
    task: str,
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 4000,
    temperature: float = 0.3,
    _retries: int = 3,
    response_mime_type: str | None = None,
    response_schema: Any | None = None,
) -> str:
    """Unified helper to call Gemini with the right model for the task.

    Auto-retries up to _retries times on 429 RESOURCE_EXHAUSTED,
    honouring the retryDelay from the error response.

    Pass response_mime_type="application/json" + response_schema=<PydanticModel>
    to enforce both valid JSON and exact output shape at the API level.
    Only use these for JSON-returning tasks, never for LaTeX generation.
    """
    import asyncio

    client = _get_gemini()
    model = get_model_for_task(task)

    for attempt in range(_retries):
        try:
            response = client.models.generate_content(
                model=model,
                contents=user_prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    max_output_tokens=max_tokens,
                    temperature=temperature,
                    response_mime_type=response_mime_type,
                    response_schema=response_schema,
                ),
            )
            text = response.text
            if not text or not text.strip():
                raise ValueError(f"Gemini returned empty response for task '{task}'")
            return text
        except Exception as exc:
            err_str = str(exc)
            is_rate_limit = "429" in err_str or "RESOURCE_EXHAUSTED" in err_str
            if is_rate_limit and attempt < _retries - 1:
                # Extract retryDelay from error message (e.g. "Please retry in 53s")
                match = re.search(r"retry[^\d]*(\d+(?:\.\d+)?)\s*s", err_str, re.IGNORECASE)
                wait = float(match.group(1)) + 2 if match else 60.0
                logger.warning(
                    "Gemini 429 on attempt %d/%d — waiting %.0fs then retrying",
                    attempt + 1, _retries, wait,
                )
                await asyncio.sleep(wait)
                continue
            raise


def _build_latex_from_profile(parsed_resume: dict[str, Any]) -> str:
    """Build a baseline LaTeX resume from parsed profile JSON.

    Used when the user doesn't have an existing LaTeX source.
    """
    contact = parsed_resume.get("contact") or {}
    name = contact.get("name") or parsed_resume.get("name") or "Your Name"
    email = contact.get("email") or "email@example.com"
    phone = contact.get("phone") or ""
    linkedin = contact.get("linkedin") or "https://linkedin.com/in/yourprofile"
    github = contact.get("github") or "https://github.com/yourprofile"

    # Summary
    summary = parsed_resume.get("summary") or "Experienced professional seeking new opportunities."

    # Experience
    experience_entries = ""
    for exp in (parsed_resume.get("experience") or [])[:4]:
        role = exp.get("role") or exp.get("title") or "Role"
        company = exp.get("company") or "Company"
        start = exp.get("start_date") or exp.get("startDate") or ""
        end = exp.get("end_date") or exp.get("endDate") or "Present"
        bullets = exp.get("bullets") or exp.get("description") or []
        if isinstance(bullets, str):
            bullets = [bullets]

        entry = f"    \\resumeSubheading{{{role}}}{{{start} -- {end}}}{{{company}}}{{}}\n"
        if bullets:
            entry += "    \\resumeItemListStart\n"
            for bullet in bullets[:5]:
                safe_bullet = bullet.replace("%", "\\%").replace("&", "\\&")
                entry += f"      \\resumeItem{{{safe_bullet}}}\n"
            entry += "    \\resumeItemListEnd\n"
        experience_entries += entry

    # Projects
    project_entries = ""
    for proj in (parsed_resume.get("projects") or [])[:3]:
        proj_name = proj.get("name") or proj.get("title") or "Project"
        tech = proj.get("technologies") or proj.get("tech") or []
        tech_str = ", ".join(tech) if isinstance(tech, list) else str(tech)
        bullets = proj.get("bullets") or proj.get("description") or []
        if isinstance(bullets, str):
            bullets = [bullets]

        entry = f"    \\resumeProjectHeading{{\\textbf{{{proj_name}}} $|$ \\emph{{\\small{{{tech_str}}}}}}}{{}}\n"
        if bullets:
            entry += "    \\resumeItemListStart\n"
            for bullet in bullets[:3]:
                safe_bullet = bullet.replace("%", "\\%").replace("&", "\\&")
                entry += f"      \\resumeItem{{{safe_bullet}}}\n"
            entry += "    \\resumeItemListEnd\n"
        project_entries += entry

    # Education
    education_entries = ""
    for edu in (parsed_resume.get("education") or [])[:2]:
        degree = edu.get("degree") or "Degree"
        field = edu.get("field") or edu.get("major") or ""
        institution = edu.get("institution") or edu.get("school") or "University"
        year = edu.get("year") or edu.get("graduation_date") or ""
        degree_str = f"{degree} in {field}" if field else degree
        education_entries += (
            f"    \\resumeSubheading{{{institution}}}{{{year}}}"
            f"{{{degree_str}}}{{}}\n"
        )

    # Skills
    skills = parsed_resume.get("skills") or []
    if isinstance(skills, list):
        # Try to categorize
        skill_str = ", ".join(skills)
        skill_languages = skill_str
        skill_frameworks = ""
        skill_tools = ""
    elif isinstance(skills, dict):
        skill_languages = ", ".join(skills.get("languages") or skills.get("programming") or [])
        skill_frameworks = ", ".join(skills.get("frameworks") or skills.get("libraries") or [])
        skill_tools = ", ".join(skills.get("tools") or skills.get("devops") or [])
    else:
        skill_languages = str(skills)
        skill_frameworks = ""
        skill_tools = ""

    role_title = parsed_resume.get("target_role") or "Software Engineer"

    return DEFAULT_LATEX_TEMPLATE % {
        "name": name.replace("%", "\\%"),
        "role_title": role_title.replace("%", "\\%"),
        "phone": phone.replace("%", "\\%"),
        "email": email.replace("%", "\\%"),
        "linkedin_url": linkedin,
        "github_url": github,
        "summary": summary.replace("%", "\\%"),
        "experience_entries": experience_entries,
        "project_entries": project_entries,
        "education_entries": education_entries,
        "skill_languages": skill_languages.replace("%", "\\%"),
        "skill_frameworks": skill_frameworks.replace("%", "\\%"),
        "skill_tools": skill_tools.replace("%", "\\%"),
    }


def _extract_latex(raw_response: str) -> str:
    """Extract LaTeX source from Claude's response, stripping markdown fences if present."""
    # Strip ```latex ... ``` wrapper if present
    match = re.search(r"```(?:latex|tex)?\s*\n(.*?)```", raw_response, re.DOTALL)
    if match:
        return match.group(1).strip()

    # If it starts with \documentclass, it's already clean
    if raw_response.strip().startswith("\\documentclass") or raw_response.strip().startswith("% ASSUMPTION"):
        return raw_response.strip()

    return raw_response.strip()


def _generate_version_name(
    company_name: str | None, job_title: str | None
) -> str:
    """Generate auto version name: Company_Role_MonthYear."""
    now = datetime.now()
    month_year = now.strftime("%b%Y")
    company = (company_name or "Company").replace(" ", "")[:20]
    role = (job_title or "Role").replace(" ", "")[:20]
    return f"{company}_{role}_{month_year}"


# ─── Pydantic schema for Gemini response_schema (Option B) ──────────────────
# Passed to GenerateContentConfig.response_schema so the Gemini API constrains
# its output to this exact shape at the token-sampling level.

class _ContactSchema(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""

class _ExperienceSchema(BaseModel):
    role: str = ""
    company: str = ""
    start_date: str = ""
    end_date: str = ""
    location: str = ""
    bullets: list[str] = []

class _EducationSchema(BaseModel):
    institution: str = ""
    degree: str = ""
    field: str = ""
    year: str = ""
    gpa: str = ""

class _ProjectSchema(BaseModel):
    name: str = ""
    technologies: list[str] = []
    bullets: list[str] = []

class _ResumeParseSchema(BaseModel):
    contact: _ContactSchema = _ContactSchema()
    summary: str = ""
    target_role: str = ""
    experience: list[_ExperienceSchema] = []
    education: list[_EducationSchema] = []
    projects: list[_ProjectSchema] = []
    skills: list[str] = []
    certifications: list[str] = []
    languages: list[str] = []


_PARSE_RESUME_SYSTEM_PROMPT = """You are an expert ATS (Applicant Tracking System) data extraction engine. Your job is to extract EVERY piece of information from the resume text with 100% accuracy. Do not skip, summarize, or truncate anything.

IMPORTANT: Output ONLY a single raw JSON object. No markdown. No code fences (no ```json). No explanatory text before or after. Your response must start with { and end with }. Nothing else.

Return ONLY a valid JSON object (no markdown fences, no extra text, no comments) matching EXACTLY this schema:
{
  "contact": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+1-555-000-0000",
    "location": "City, State",
    "linkedin": "https://linkedin.com/in/...",
    "github": "https://github.com/...",
    "portfolio": ""
  },
  "summary": "Full professional summary exactly as written",
  "target_role": "Inferred target job title from most recent role or resume direction",
  "experience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "start_date": "Jan 2022",
      "end_date": "Present",
      "location": "City, State",
      "bullets": ["Full achievement bullet 1", "Full achievement bullet 2"]
    },
    {
      "role": "Previous Job Title",
      "company": "Previous Company",
      "start_date": "Jun 2020",
      "end_date": "Dec 2021",
      "location": "City, State",
      "bullets": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "year": "2021",
      "gpa": ""
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "technologies": ["Python", "React"],
      "bullets": ["What it does and its impact"]
    }
  ],
  "skills": ["Python", "React", "SQL"],
  "certifications": ["AWS Certified Solutions Architect"],
  "languages": ["English", "Spanish"]
}

CRITICAL EXTRACTION RULES — READ CAREFULLY:
1. EXTRACT ALL JOBS: You MUST extract EVERY SINGLE work experience listed in the resume. NEVER skip an employer. Look carefully for all companies mentioned.
2. DIFFERENTIATE JOBS VS PROJECTS: If an entry has a Company Name, Job Title, and Date Range, it MUST go into the "experience" array, NOT "projects".
3. NO SUMMARIZATION: Extract ALL bullet points for every job word-for-word. Do not summarize.
4. DATE FORMATTING: If a job says "Present" or has no end date, use "Present" as end_date.
5. BLANK FIELDS: Use empty string "" for missing text fields, empty array [] for missing list fields.
6. SKILLS: `skills` must be a flat list of ALL technical and soft skills found anywhere in the document.
7. JSON INTEGRITY: The JSON MUST be complete and valid. Never stop mid-object. Ensure all brackets are closed.
"""


def _clean_gemini_json_response(raw: str) -> str:
    """Robustly strip markdown fences and extract clean JSON from a Gemini response.

    Handles: ```json fences, surrounding prose, // comments, trailing commas.
    Applied before json.loads() as a defensive layer even when response_mime_type
    is set, in case of SDK version edge-cases.
    """
    text = raw.strip()

    # Strip ```json ... ``` or ``` ... ``` fences (any casing)
    text = re.sub(r"^```(?:json|JSON|Json)?\s*\n?", "", text)
    text = re.sub(r"\n?```\s*$", "", text)
    text = text.strip()

    # If there's prose before/after the JSON object, extract first { ... }
    start = text.find("{")
    end = text.rfind("}")
    if start > 0 and end > start:
        text = text[start : end + 1]
    elif start == -1:
        # No JSON object found at all — return as-is and let json.loads fail naturally
        return text

    # Remove single-line // comments (not valid JSON)
    text = re.sub(r"//[^\n]*\n", "\n", text)

    # Remove trailing commas before } or ] (common Gemini mistake)
    text = re.sub(r",\s*([}\]])", r"\1", text)

    return text.strip()


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from PDF bytes using PyMuPDF."""
    import fitz  # PyMuPDF

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_text = []
    for page in doc:
        pages_text.append(page.get_text())
    doc.close()
    return "\n".join(pages_text)


def _extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract plain text from DOCX bytes using python-docx."""
    from docx import Document

    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
    return "\n".join(paragraphs)


async def parse_resume_file(file_bytes: bytes, content_type: str) -> ParseResumeResponse:
    """Extract text from PDF/DOCX and parse into structured JSON via Gemini Flash."""
    # Step 1: Extract raw text
    if "pdf" in content_type:
        raw_text = _extract_text_from_pdf(file_bytes)
    else:
        raw_text = _extract_text_from_docx(file_bytes)

    if not raw_text.strip():
        raise ValueError("Could not extract any text from the uploaded file.")

    # Truncate to avoid hitting token limits (~12k chars ≈ 3k tokens)
    truncated_text = raw_text[:12000]

    # Step 2: Call Gemini Flash for structured extraction.
    # response_mime_type + response_schema together enforce both valid JSON
    # AND the exact output shape at the Gemini API token-sampling level.
    raw_json = await _call_gemini(
        task="parse_resume",
        system_prompt=_PARSE_RESUME_SYSTEM_PROMPT,
        user_prompt=f"Parse this resume:\n\n{truncated_text}",
        max_tokens=4096,
        temperature=0.1,
        response_mime_type="application/json",
        response_schema=_ResumeParseSchema,
    )

    # Step 3: Parse JSON response.
    # _clean_gemini_json_response strips residual markdown fences and prose
    # before we attempt parsing — makes json_repair's job easier.
    clean = _clean_gemini_json_response(raw_json)

    try:
        # strict=False handles raw control characters (newlines, tabs) inside
        # JSON string values — covers PDF content Gemini embeds literally.
        parsed_data = json.loads(clean, strict=False)
    except json.JSONDecodeError as exc:
        logger.warning("Gemini returned non-JSON for resume parse: %s — attempting repair", exc)
        try:
            # json_repair handles all structural issues: missing commas,
            # trailing commas, unquoted keys, truncated output, etc.
            parsed_data = repair_json(clean, return_objects=True)
            if not isinstance(parsed_data, dict):
                raise ValueError("repair_json returned non-dict")
            logger.info("json-repair succeeded")
        except Exception:
            logger.warning("json-repair failed — raising error to caller")
            raise ValueError(
                "Resume parsing failed — the AI returned an unreadable response. "
                "Please try re-uploading your resume."
            )

    return ParseResumeResponse(parsed_data=parsed_data)


async def tailor_resume(request: TailorResumeRequest) -> TailorResumeResponse:
    """Main tailoring pipeline: profile + JD → Claude → LaTeX → PDF → upload."""
    start_time = time.monotonic()

    # Step 1: Build baseline LaTeX from parsed resume
    parsed = request.parsed_resume_json
    existing_latex = parsed.get("latex_source") or parsed.get("latexSource")
    if existing_latex:
        base_latex = existing_latex
    else:
        base_latex = _build_latex_from_profile(parsed)

    # Step 2: Extract company/role from JD for naming
    company_name = request.company_name or None
    job_title = request.job_title or None
    version_name = _generate_version_name(company_name, job_title)

    # Step 3: Call Gemini for tailoring (uses gemini-1.5-pro for reliable LaTeX)
    try:
        user_message = f"""Here is the job description (JD):

{request.job_description}

Here is the LaTeX resume to tailor:

{base_latex}"""

        raw_output = await _call_gemini(
            task="tailor_resume",
            system_prompt=RESUME_TAILOR_SYSTEM_PROMPT,
            user_prompt=user_message,
            max_tokens=4096,
            temperature=0.2,
        )
        latex_source = _extract_latex(raw_output)

    except Exception as exc:
        logger.error("Gemini tailoring failed: %s", exc)
        # Return the baseline LaTeX with error flag
        elapsed = int((time.monotonic() - start_time) * 1000)
        return TailorResumeResponse(
            latex_source=base_latex,
            pdf_url="",
            version_name=version_name,
            generation_time_ms=elapsed,
            error="AI tailoring failed — returning original resume. Error: " + str(exc),
        )

    elapsed = int((time.monotonic() - start_time) * 1000)

    # LaTeX is returned as-is; PDF is compiled on-demand via /ai/compile-pdf
    return TailorResumeResponse(
        latex_source=latex_source,
        pdf_url="",
        version_name=version_name,
        generation_time_ms=elapsed,
        error=None,
    )


# ─── Outreach Generation ────────────────────────────────────────────────────

from src.models.outreach import OutreachRequest, OutreachResponse
from src.prompts.cold_email import (
    COLD_EMAIL_SYSTEM_PROMPT,
    LINKEDIN_MESSAGE_SYSTEM_PROMPT,
    REFERRAL_REQUEST_SYSTEM_PROMPT,
)


def _build_outreach_user_prompt(request: OutreachRequest) -> str:
    """Build the user prompt for outreach generation."""
    profile = request.user_profile
    job = request.job

    parts = [
        f"Candidate Name: {profile.get('name', 'Candidate')}",
        f"Target Role: {job.get('title', 'N/A')} at {job.get('company_name', 'the company')}",
    ]

    skills = profile.get("skills") or []
    if skills:
        parts.append(f"Candidate Skills: {', '.join(skills[:15])}")

    experience = profile.get("experience_summary") or profile.get("current_role")
    if experience:
        parts.append(f"Current/Recent Role: {experience}")

    jd = job.get("description") or ""
    if jd:
        parts.append(f"Job Description (excerpt): {jd[:500]}")

    if request.recruiter_name:
        parts.append(f"Recruiter/Contact Name: {request.recruiter_name}")

    relationship = request.user_profile.get("relationship_context")
    if relationship:
        parts.append(f"Relationship with contact: {relationship}")

    parts.append(f"Desired tone: {request.tone}")

    return "\n".join(parts)


async def generate_outreach(request: OutreachRequest) -> OutreachResponse:
    """Generate outreach message using Gemini Flash."""
    # Select system prompt based on type
    prompt_map = {
        "cold_email": COLD_EMAIL_SYSTEM_PROMPT,
        "linkedin_inmail": LINKEDIN_MESSAGE_SYSTEM_PROMPT,
        "referral_request": REFERRAL_REQUEST_SYSTEM_PROMPT,
    }
    system_prompt = prompt_map.get(request.outreach_type, COLD_EMAIL_SYSTEM_PROMPT)
    user_prompt = _build_outreach_user_prompt(request)

    try:
        raw_text = await _call_gemini(
            task="generate_outreach",
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=1000,
        )
        parsed = json.loads(raw_text)

        return OutreachResponse(
            subject=parsed.get("subject"),
            subject_alternatives=parsed.get("subject_alternatives"),
            body=parsed["body"],
            personalization_points=parsed.get("personalization_points", []),
        )

    except Exception as exc:
        logger.error("Outreach generation failed: %s", exc)
        # Return a fallback template
        job_title = request.job.get("title", "the position")
        company = request.job.get("company_name", "your company")
        name = request.user_profile.get("name", "I")

        if request.outreach_type == "cold_email":
            return OutreachResponse(
                subject=f"Interest in {job_title} at {company}",
                subject_alternatives=[
                    f"Experienced developer interested in {job_title}",
                    f"Application for {job_title} — {company}",
                ],
                body=f"Hi {request.recruiter_name or 'there'},\n\nI came across the {job_title} position at {company} and I'm very interested. My background aligns well with the requirements.\n\nWould you be open to a brief conversation?\n\nBest regards,\n{name}",
                personalization_points=["Fallback template — AI generation failed"],
            )
        elif request.outreach_type == "linkedin_inmail":
            return OutreachResponse(
                body=f"Hi! I'm interested in the {job_title} role at {company}. My skills align well — would love to connect and learn more!",
                personalization_points=["Fallback template"],
            )
        else:
            return OutreachResponse(
                body=f"Hi {request.recruiter_name or 'there'},\n\nI saw a {job_title} opening at {company} that I'd love to apply for. Given our connection, I was wondering if you'd be open to referring me. Happy to share my resume and chat.\n\nThanks!",
                personalization_points=["Fallback template"],
            )


# ─── Interview Evaluation ────────────────────────────────────────────────────

_EVALUATE_INTERVIEW_SYSTEM_PROMPT = """You are an expert technical recruiter evaluating a candidate's AI interview.

Given a job title, optional job description, and a Q&A transcript, produce a structured evaluation.

Return ONLY valid JSON matching this exact schema:
{
  "score": <integer 0-100>,
  "summary": "<2-3 sentence narrative of overall performance>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "areas_for_improvement": ["<area 1>", "<area 2>", ...],
  "recommendation": "<one of: strong_hire | hire | no_hire | strong_no_hire>"
}

Scoring guide:
- 85-100: Exceptional — exceeds requirements, strong hire
- 70-84: Good — meets requirements well, hire
- 50-69: Average — meets some requirements, borderline
- 0-49: Below expectations — no hire

Keep strengths and areas_for_improvement to 2–4 items each. Be concise and specific."""


class EvaluateInterviewResponse(BaseModel):
    """Public response model — imported by routers/interview.py (no circular dep)."""
    score: int
    summary: str
    strengths: list[str]
    areas_for_improvement: list[str]
    recommendation: str


class _InterviewEvalSchema(BaseModel):
    score: int
    summary: str
    strengths: list[str]
    areas_for_improvement: list[str]
    recommendation: str


async def evaluate_interview(
    job_title: str,
    job_description: str,
    transcript: list[dict[str, str]],
) -> EvaluateInterviewResponse:
    """Evaluate an AI interview transcript using Gemini Flash.

    Returns a structured evaluation with score, summary, strengths,
    areas for improvement, and a hire recommendation.
    Falls back to a neutral evaluation if Gemini fails.
    """

    transcript_text = "\n\n".join(
        f"Q: {entry['question']}\nA: {entry['answer']}"
        for entry in transcript
    )

    user_prompt = f"""Job Title: {job_title}
{f'Job Description: {job_description[:800]}' if job_description else ''}

Interview Transcript:
{transcript_text}

Evaluate this candidate."""

    try:
        raw_json = await _call_gemini(
            task="evaluate_interview",
            system_prompt=_EVALUATE_INTERVIEW_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=1024,
            temperature=0.2,
            response_mime_type="application/json",
            response_schema=_InterviewEvalSchema,
        )

        clean = _clean_gemini_json_response(raw_json)

        try:
            data = json.loads(clean, strict=False)
        except json.JSONDecodeError:
            data = repair_json(clean, return_objects=True)
            if not isinstance(data, dict):
                raise ValueError("repair_json returned non-dict for interview evaluation")

        # Clamp score to valid range
        score = max(0, min(100, int(data.get("score", 50))))
        recommendation = data.get("recommendation", "no_hire")
        if recommendation not in {"strong_hire", "hire", "no_hire", "strong_no_hire"}:
            recommendation = "no_hire"

        return EvaluateInterviewResponse(
            score=score,
            summary=data.get("summary", "Evaluation completed."),
            strengths=data.get("strengths", []),
            areas_for_improvement=data.get("areas_for_improvement", []),
            recommendation=recommendation,
        )

    except Exception as exc:
        logger.error("Interview evaluation failed: %s", exc)
        # Fallback: return a neutral mid-range evaluation so the pipeline isn't blocked
        return EvaluateInterviewResponse(
            score=50,
            summary="Automatic evaluation was unavailable. Please review the transcript manually.",
            strengths=["Completed the interview"],
            areas_for_improvement=["Manual review required"],
            recommendation="no_hire",
        )


# ─── Resume Screening ────────────────────────────────────────────────────────

_SCREEN_RESUME_SYSTEM_PROMPT = """You are an expert technical recruiter screening a candidate's resume against a job description.

Given structured resume JSON, a job description, required skills, and nice-to-have skills, produce a structured screening evaluation.

Return ONLY valid JSON matching this exact schema:
{
  "score": <integer 0-100 overall weighted score>,
  "breakdown": {
    "skillMatch": <integer 0-100>,
    "experienceRelevance": <integer 0-100>,
    "educationFit": <integer 0-100>,
    "achievementSignals": <integer 0-100>,
    "cultureFit": <integer 0-100>,
    "screeningQuestions": <integer 0-100>
  },
  "summary": "<2-3 sentence narrative summarising fit for the role>",
  "bucket": "<one of: strong_fit | good_fit | potential_fit | weak_fit>"
}

Scoring weights: skillMatch 30%, experienceRelevance 25%, educationFit 10%, achievementSignals 15%, cultureFit 10%, screeningQuestions 10%.
Bucket thresholds: strong_fit ≥80, good_fit ≥60, potential_fit ≥40, weak_fit <40."""


class _ScreenBreakdownSchema(BaseModel):
    skillMatch: int = 0
    experienceRelevance: int = 0
    educationFit: int = 0
    achievementSignals: int = 0
    cultureFit: int = 0
    screeningQuestions: int = 0


class _ScreenResumeSchema(BaseModel):
    score: int = 0
    breakdown: _ScreenBreakdownSchema
    summary: str = ""
    bucket: str = "weak_fit"


async def screen_resume(
    resume: dict[str, Any],
    job_description: str,
    required_skills: list[str],
    nice_to_have_skills: list[str],
    dimension_weights: dict[str, float] | None = None,
    screening_responses: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    """Screen a parsed resume against a job using Gemini Flash.

    Returns screening_score, screening_breakdown, screening_summary, bucket.
    Falls back to a simple skill-overlap score if Gemini fails.
    """
    skills_str = ", ".join(required_skills[:30]) if required_skills else "not specified"
    nice_str = ", ".join(nice_to_have_skills[:15]) if nice_to_have_skills else "none"
    responses_str = ""
    if screening_responses:
        responses_str = "\n\nScreening Q&A:\n" + "\n".join(
            f"Q: {r.get('question', '')}\nA: {r.get('answer', '')}"
            for r in screening_responses[:5]
        )

    # Compact resume representation to stay within token limits
    contact = resume.get("contact") or {}
    user_prompt = f"""Candidate: {contact.get('name', 'Unknown')}
Summary: {(resume.get('summary') or '')[:300]}
Experience: {json.dumps((resume.get('experience') or [])[:3], ensure_ascii=False)[:600]}
Education: {json.dumps((resume.get('education') or [])[:2], ensure_ascii=False)[:200]}
Skills: {', '.join((resume.get('skills') or [])[:30])}

Job Description (excerpt): {job_description[:600]}
Required Skills: {skills_str}
Nice-to-Have Skills: {nice_str}{responses_str}

Screen this candidate and return the JSON evaluation."""

    try:
        raw_json = await _call_gemini(
            task="screen_resume",
            system_prompt=_SCREEN_RESUME_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=512,
            temperature=0.1,
            response_mime_type="application/json",
            response_schema=_ScreenResumeSchema,
        )

        clean = _clean_gemini_json_response(raw_json)
        try:
            data = json.loads(clean, strict=False)
        except json.JSONDecodeError:
            data = repair_json(clean, return_objects=True)
            if not isinstance(data, dict):
                raise ValueError("repair_json returned non-dict for screen_resume")

        score = max(0, min(100, int(data.get("score", 0))))
        bd = data.get("breakdown") or {}
        bucket = data.get("bucket", "weak_fit")
        if bucket not in {"strong_fit", "good_fit", "potential_fit", "weak_fit"}:
            bucket = "weak_fit"

        return {
            "screening_score": score,
            "screening_breakdown": {
                "skillMatch": max(0, min(100, int(bd.get("skillMatch", 0)))),
                "experienceRelevance": max(0, min(100, int(bd.get("experienceRelevance", 0)))),
                "educationFit": max(0, min(100, int(bd.get("educationFit", 0)))),
                "achievementSignals": max(0, min(100, int(bd.get("achievementSignals", 0)))),
                "cultureFit": max(0, min(100, int(bd.get("cultureFit", 0)))),
                "screeningQuestions": max(0, min(100, int(bd.get("screeningQuestions", 0)))),
            },
            "screening_summary": data.get("summary", ""),
            "bucket": bucket,
        }

    except Exception as exc:
        logger.error("screen_resume Gemini call failed: %s — using skill-overlap fallback", exc)
        # Simple skill-overlap fallback
        resume_skills = [s.lower().strip() for s in (resume.get("skills") or [])]
        req_norm = [s.lower().strip() for s in required_skills]
        matches = sum(1 for s in req_norm if s in resume_skills)
        ratio = matches / len(req_norm) if req_norm else 0.5
        skill_match = round(ratio * 100)
        exp_rel = 60
        overall = round(skill_match * 0.3 + exp_rel * 0.25 + 50 * 0.45)
        bucket = "strong_fit" if overall >= 80 else "good_fit" if overall >= 60 else "potential_fit" if overall >= 40 else "weak_fit"
        return {
            "screening_score": overall,
            "screening_breakdown": {
                "skillMatch": skill_match, "experienceRelevance": exp_rel,
                "educationFit": 50, "achievementSignals": 50,
                "cultureFit": 50, "screeningQuestions": 50,
            },
            "screening_summary": f"Fallback screening: {matches} of {len(req_norm)} required skills matched.",
            "bucket": bucket,
        }


# ─── Assessment question generation ──────────────────────────────────────────

_GENERATE_QUESTIONS_SYSTEM_PROMPT = """You are an expert technical assessment designer.
Generate assessment questions exactly as specified. Return a valid JSON array of question objects.
Each object must follow the schema strictly — no extra fields, no markdown."""


class _QuestionOptionSchema(BaseModel):
    text: str = ""


class _GeneratedQuestionSchema(BaseModel):
    prompt: str = ""
    type: str = "multiple_choice"
    options: list[str] = []
    correctAnswer: str = ""
    points: int = 10
    codeLanguage: str = ""


class _GeneratedQuestionsSchema(BaseModel):
    questions: list[_GeneratedQuestionSchema] = []


async def generate_questions(
    topic: str,
    question_type: str,
    difficulty: str,
    count: int,
    code_language: str | None = None,
) -> list[dict[str, Any]]:
    """Generate assessment questions using Gemini Flash.

    Returns a list of QuestionForm-compatible dicts.
    Falls back to a minimal placeholder set if Gemini fails.
    """
    difficulty_guidance = {
        "easy": "straightforward, testing basic knowledge and recall",
        "medium": "moderately challenging, testing understanding and application",
        "hard": "challenging, testing deep knowledge, edge cases, and problem-solving",
    }.get(difficulty, "moderately challenging")

    type_guidance = {
        "multiple_choice": "multiple choice with exactly 4 options (A/B/C/D). Set correctAnswer to the full text of the correct option.",
        "short_answer": "open-ended short answer. Leave options as empty array, set correctAnswer to a model answer.",
        "code": f"coding problem in {code_language or 'any language'}. Leave options as empty array, set correctAnswer to a sample solution.",
    }.get(question_type, "multiple choice")

    points_map = {"easy": 5, "medium": 10, "hard": 15}
    default_points = points_map.get(difficulty, 10)

    user_prompt = f"""Generate exactly {count} {difficulty_guidance} {question_type} questions about: {topic}

Question format: {type_guidance}
Points per question: {default_points}
{"Code language: " + code_language if code_language else ""}

Return JSON: {{ "questions": [ {{ "prompt": "...", "type": "{question_type}", "options": [...], "correctAnswer": "...", "points": {default_points}, "codeLanguage": "{code_language or ""}" }}, ... ] }}"""

    try:
        raw_json = await _call_gemini(
            task="generate_questions",
            system_prompt=_GENERATE_QUESTIONS_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=4096,
            temperature=0.7,
            response_mime_type="application/json",
            response_schema=_GeneratedQuestionsSchema,
        )

        clean = _clean_gemini_json_response(raw_json)
        try:
            data = json.loads(clean, strict=False)
        except json.JSONDecodeError:
            data = repair_json(clean, return_objects=True)
            if not isinstance(data, dict):
                raise ValueError("repair_json returned non-dict for generate_questions")

        raw_questions = data.get("questions", [])
        questions = []
        for i, q in enumerate(raw_questions[:count]):
            questions.append({
                "id": f"gen-{i}-{int(__import__('time').time())}",
                "type": q.get("type", question_type),
                "prompt": q.get("prompt", ""),
                "options": q.get("options", []),
                "correctAnswer": q.get("correctAnswer", ""),
                "points": max(1, int(q.get("points", default_points))),
                "codeLanguage": q.get("codeLanguage", code_language or ""),
            })
        return questions

    except Exception as exc:
        logger.error("generate_questions Gemini call failed: %s", exc)
        # Minimal fallback — return placeholder questions so the UI doesn't crash
        return [
            {
                "id": f"gen-fallback-{i}",
                "type": question_type,
                "prompt": f"[AI unavailable] Sample {topic} question {i + 1}",
                "options": ["Option A", "Option B", "Option C", "Option D"] if question_type == "multiple_choice" else [],
                "correctAnswer": "Option A" if question_type == "multiple_choice" else "",
                "points": default_points,
                "codeLanguage": code_language or "",
            }
            for i in range(count)
        ]
