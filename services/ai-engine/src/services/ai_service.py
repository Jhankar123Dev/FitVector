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
    """Select Gemini model based on task complexity."""
    if task == "tailor_resume":
        return "gemini-2.5-pro"
    return "gemini-2.5-flash"


async def _call_gemini(
    task: str,
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 4000,
    temperature: float = 0.3,
    _retries: int = 3,
) -> str:
    """Unified helper to call Gemini with the right model for the task.

    Auto-retries up to _retries times on 429 RESOURCE_EXHAUSTED,
    honouring the retryDelay from the error response.
    """
    import asyncio

    client = _get_gemini()
    model = get_model_for_task(task)

    for attempt in range(_retries):
        try:
            response = client.models.generate_content(
                model=model,
                contents=user_prompt,
                config={
                    "system_instruction": system_prompt,
                    "max_output_tokens": max_tokens,
                    "temperature": temperature,
                },
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


_PARSE_RESUME_SYSTEM_PROMPT = """You are an expert ATS (Applicant Tracking System) data extraction engine. Your job is to extract EVERY piece of information from the resume text with 100% accuracy. Do not skip, summarize, or truncate anything.

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

    # Step 2: Call Gemini Flash for structured extraction
    raw_json = await _call_gemini(
        task="parse_resume",
        system_prompt=_PARSE_RESUME_SYSTEM_PROMPT,
        user_prompt=f"Parse this resume:\n\n{truncated_text}",
        max_tokens=4096,
        temperature=0.1,
    )

    # Step 3: Parse JSON response
    # Strip markdown fences if model adds them
    clean = raw_json.strip()
    if clean.startswith("```"):
        clean = re.sub(r"^```(?:json)?\s*", "", clean)
        clean = re.sub(r"\s*```$", "", clean)

    try:
        parsed_data = json.loads(clean)
    except json.JSONDecodeError as exc:
        logger.warning("Gemini returned non-JSON for resume parse: %s — attempting repair", exc)
        # Attempt to repair truncated JSON by closing open structures
        repaired = clean
        # Count unclosed brackets/braces
        open_braces = repaired.count("{") - repaired.count("}")
        open_brackets = repaired.count("[") - repaired.count("]")
        # If last char is mid-string, close it
        if repaired and repaired[-1] not in ('"', '}', ']'):
            # Trim to last complete key-value pair
            last_comma = repaired.rfind(",")
            last_brace = repaired.rfind("}")
            last_bracket = repaired.rfind("]")
            trim_to = max(last_comma, last_brace, last_bracket)
            if trim_to > 0:
                repaired = repaired[:trim_to]
                open_braces = repaired.count("{") - repaired.count("}")
                open_brackets = repaired.count("[") - repaired.count("]")
        # Close open arrays first, then objects
        repaired += "]" * open_brackets + "}" * open_braces
        try:
            parsed_data = json.loads(repaired)
            logger.info("JSON repair succeeded")
        except json.JSONDecodeError:
            logger.warning("JSON repair failed — returning minimal structure")
            parsed_data = {
                "contact": {"name": "", "email": "", "phone": "", "location": ""},
                "summary": "",
                "target_role": "",
                "experience": [],
                "education": [],
                "skills": [],
                "projects": [],
                "certifications": [],
                "languages": [],
                "parse_error": str(exc),
            }

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
