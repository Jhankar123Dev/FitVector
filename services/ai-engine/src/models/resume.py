from typing import Any, Optional

from pydantic import BaseModel, Field


class CompilePdfRequest(BaseModel):
    latex_source: str = Field(..., description="LaTeX source to compile into PDF")


class ParseResumeResponse(BaseModel):
    parsed_data: dict[str, Any] = Field(
        default_factory=dict,
        description="Structured resume data (contact, experience, education, skills, etc.)",
    )


class TailorResumeRequest(BaseModel):
    parsed_resume_json: dict[str, Any] = Field(
        ..., description="Previously parsed resume JSON"
    )
    job_description: str = Field(..., description="Target job description text")
    job_title: Optional[str] = Field(
        default=None, description="Job title for version naming"
    )
    company_name: Optional[str] = Field(
        default=None, description="Company name for version naming"
    )
    template_id: str = Field(
        default="modern", description="LaTeX template identifier"
    )
    user_id: Optional[str] = Field(
        default=None, description="User ID for storage path"
    )


class TailorResumeResponse(BaseModel):
    latex_source: str = Field(..., description="Generated LaTeX source code")
    pdf_url: str = Field(default="", description="URL to the compiled PDF (empty if compilation failed)")
    version_name: str = Field(..., description="Human-readable version label")
    generation_time_ms: int = Field(
        ..., description="Time taken to generate in milliseconds"
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message if PDF compilation failed (LaTeX source still available)",
    )
