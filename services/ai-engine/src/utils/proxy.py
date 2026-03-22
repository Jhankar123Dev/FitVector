"""Proxy pool management for web scraping."""

from src.config import settings


def get_proxy_config() -> dict[str, str] | None:
    """Return proxy dict for httpx/jobspy if configured, else None."""
    if not settings.proxy_url:
        return None
    return {
        "http": settings.proxy_url,
        "https": settings.proxy_url,
    }
