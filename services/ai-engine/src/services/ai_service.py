"""AI-powered resume tailoring service.

Pipeline: user profile JSON + JD text → Claude API → LaTeX source → Tectonic PDF → Supabase upload.
"""

from __future__ import annotations

import json
import logging
import re
import time
from datetime import datetime
from typing import Any

from src.config import settings
from src.models.resume import TailorResumeRequest, TailorResumeResponse
from src.prompts.resume_tailor import (
    DEFAULT_LATEX_TEMPLATE,
    RESUME_TAILOR_SYSTEM_PROMPT,
)
from src.services.pdf_service import compile_latex_to_pdf, upload_pdf_to_supabase

logger = logging.getLogger("fitvector.ai_service")


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

    # Step 3: Call Claude for tailoring
    try:
        from anthropic import AsyncAnthropic  # type: ignore[import-untyped]

        client = AsyncAnthropic(api_key=settings.anthropic_api_key)

        user_message = f"""Here is the job description (JD):

{request.job_description}

Here is the LaTeX resume to tailor:

{base_latex}"""

        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=RESUME_TAILOR_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        raw_output = response.content[0].text
        latex_source = _extract_latex(raw_output)

    except Exception as exc:
        logger.error("Claude tailoring failed: %s", exc)
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
