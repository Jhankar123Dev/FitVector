"""Text normalization and cleaning utilities."""

import hashlib
import re


def normalize_text(text: str) -> str:
    """Lowercase, collapse whitespace, strip."""
    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text


def job_fingerprint(title: str, company: str, location: str) -> str:
    """Generate a deduplication fingerprint hash from title + company + location."""
    raw = normalize_text(f"{title}|{company}|{location}")
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def truncate_words(text: str, max_words: int = 500) -> str:
    """Return the first *max_words* words of *text*."""
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words])
