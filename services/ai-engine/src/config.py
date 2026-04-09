from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # AI provider keys
    gemini_api_key: str = ""

    # Internal service auth
    python_service_secret: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""

    # Redis / BullMQ
    upstash_redis_url: str = ""
    upstash_redis_token: str = ""

    # Email-finder provider keys
    hunter_api_key: str = ""
    apollo_api_key: str = ""
    snov_api_key: str = ""

    # Proxy for web scraping
    proxy_url: str = ""

    # Allowed CORS origin — set to your deployed Next.js URL in production
    next_app_url: str = "http://localhost:3000"

    # Feature flags (admin-controlled)
    enable_llm_job_analysis: bool = True
    enable_gap_analysis: bool = True

    @property
    def service_secret(self) -> str:
        """Alias used by the auth middleware."""
        return self.python_service_secret


settings = Settings()
