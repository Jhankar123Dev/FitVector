from typing import Any

from pydantic import BaseModel, Field


class ParseResumeRequest(BaseModel):
    file_url: str = Field(..., description="URL to the uploaded resume file")
    file_type: str = Field(..., description="File MIME type (application/pdf, application/docx, etc.)")


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
    template_id: str = Field(
        default="default", description="LaTeX template identifier"
    )


class TailorResumeResponse(BaseModel):
    latex_source: str = Field(..., description="Generated LaTeX source code")
    pdf_url: str = Field(..., description="URL to the compiled PDF")
    version_name: str = Field(..., description="Human-readable version label")
    generation_time_ms: int = Field(
        ..., description="Time taken to generate in milliseconds"
    )
