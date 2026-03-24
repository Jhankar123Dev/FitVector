"""AI-powered services: resume tailoring and outreach generation.

Resume: user profile JSON + JD text → Gemini API → LaTeX source → Tectonic PDF → Supabase upload.
Outreach: user profile + job → Gemini API → cold email / LinkedIn msg / referral request.
"""

from __future__ import annotations

import json
import logging
import re
import time
from datetime import datetime
from typing import Any

from google import genai

from src.config import settings
from src.models.resume import TailorResumeRequest, TailorResumeResponse
from src.prompts.resume_tailor import (
    DEFAULT_LATEX_TEMPLATE,
    RESUME_TAILOR_SYSTEM_PROMPT,
)
from src.services.pdf_service import compile_latex_to_pdf, upload_pdf_to_supabase

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
        return "gemini-1.5-pro"
    return "gemini-2.0-flash"


async def _call_gemini(
    task: str,
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 4000,
    temperature: float = 0.3,
) -> str:
    """Unified helper to call Gemini with the right model for the task."""
    client = _get_gemini()
    model = get_model_for_task(task)
    response = client.models.generate_content(
        model=model,
        contents=user_prompt,
        config={
            "system_instruction": system_prompt,
            "max_output_tokens": max_tokens,
            "temperature": temperature,
        },
    )
    return response.text


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

    # Step 4: Compile LaTeX to PDF
    pdf_bytes, compile_error = await compile_latex_to_pdf(latex_source, timeout=10.0)

    pdf_url = ""
    error_msg = None

    if pdf_bytes and request.user_id:
        # Step 5: Upload to Supabase
        uploaded_url = await upload_pdf_to_supabase(
            pdf_bytes, request.user_id, version_name
        )
        if uploaded_url:
            pdf_url = uploaded_url
    elif compile_error:
        error_msg = compile_error
        logger.warning("PDF compilation failed: %s", compile_error)

    elapsed = int((time.monotonic() - start_time) * 1000)

    return TailorResumeResponse(
        latex_source=latex_source,
        pdf_url=pdf_url,
        version_name=version_name,
        generation_time_ms=elapsed,
        error=error_msg,
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
