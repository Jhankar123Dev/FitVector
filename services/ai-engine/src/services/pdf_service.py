"""PDF compilation service using Tectonic (LaTeX → PDF).

Falls back gracefully if Tectonic is not installed.
"""

from __future__ import annotations

import asyncio
import logging
import os
import tempfile
from pathlib import Path

logger = logging.getLogger("fitvector.pdf")


async def compile_latex_to_pdf(
    latex_source: str, timeout: float = 10.0
) -> tuple[bytes | None, str | None]:
    """Compile LaTeX source to PDF using Tectonic.

    Returns:
        (pdf_bytes, error_message)
        - On success: (bytes, None)
        - On failure: (None, error_string)
    """
    with tempfile.TemporaryDirectory(prefix="fv_latex_") as tmpdir:
        tex_path = Path(tmpdir) / "resume.tex"
        pdf_path = Path(tmpdir) / "resume.pdf"

        tex_path.write_text(latex_source, encoding="utf-8")

        try:
            proc = await asyncio.wait_for(
                asyncio.create_subprocess_exec(
                    "tectonic",
                    "-Z", "shell-escape-cwd=" + tmpdir,
                    str(tex_path),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=tmpdir,
                ),
                timeout=timeout,
            )
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=timeout
            )

            if proc.returncode != 0:
                error_msg = stderr.decode("utf-8", errors="replace").strip()
                logger.error("Tectonic failed (rc=%d): %s", proc.returncode, error_msg[:500])
                return None, f"LaTeX compilation failed: {error_msg[:200]}"

            if pdf_path.exists():
                pdf_bytes = pdf_path.read_bytes()
                logger.info("PDF compiled successfully (%d bytes)", len(pdf_bytes))
                return pdf_bytes, None
            else:
                return None, "PDF file not generated"

        except asyncio.TimeoutError:
            logger.error("Tectonic timed out after %ss", timeout)
            return None, f"LaTeX compilation timed out after {timeout}s"

        except FileNotFoundError:
            logger.warning("Tectonic not installed — returning LaTeX source only")
            return None, "Tectonic not installed. PDF compilation unavailable."

        except Exception as exc:
            logger.error("PDF compilation error: %s", exc)
            return None, f"Compilation error: {str(exc)}"


async def upload_pdf_to_supabase(
    pdf_bytes: bytes,
    user_id: str,
    version_name: str,
) -> str | None:
    """Upload compiled PDF to Supabase Storage.

    Returns the public URL or None on failure.
    """
    try:
        from supabase import create_client  # type: ignore[import-untyped]
        from src.config import settings

        if not settings.supabase_url or not settings.supabase_service_key:
            logger.warning("Supabase not configured — skipping PDF upload")
            return None

        client = create_client(settings.supabase_url, settings.supabase_service_key)

        # Sanitize filename
        safe_name = "".join(
            c if c.isalnum() or c in "-_" else "_" for c in version_name
        )
        file_path = f"{user_id}/{safe_name}.pdf"

        # Upload to tailored-resumes bucket
        result = client.storage.from_("tailored-resumes").upload(
            file_path,
            pdf_bytes,
            {"content-type": "application/pdf", "upsert": "true"},
        )

        # Get public URL
        url_result = client.storage.from_("tailored-resumes").get_public_url(file_path)
        logger.info("PDF uploaded: %s", url_result)
        return url_result

    except Exception as exc:
        logger.error("PDF upload failed: %s", exc)
        return None
