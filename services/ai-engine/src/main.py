import truststore

# Inject the OS / system certificate store so Python validates TLS certs properly.
# This replaces the previous ssl._create_unverified_context workaround which
# disabled certificate verification entirely and exposed the service to MITM attacks.
truststore.inject_into_ssl()

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.middleware import ServiceAuthMiddleware
from src.routers import health, scraper, resume, outreach, scoring, email_finder, interview, assessment, screening

logger = logging.getLogger("fitvector.ai-engine")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI-Engine starting up")
    yield
    logger.info("AI-Engine shutting down")


app = FastAPI(
    title="FitVector AI Engine",
    version="0.1.0",
    description="FastAPI microservice powering AI/ML workloads for FitVector",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────
# Restrict CORS to the Next.js app only. Wildcard origins with allow_credentials=True
# would let any website make credentialed cross-origin requests to this service.
_allowed_origins = [settings.next_app_url]
if settings.next_app_url != "http://localhost:3000":
    _allowed_origins.append("http://localhost:3000")  # always allow local dev

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Internal-Key"],
)
app.add_middleware(ServiceAuthMiddleware)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(scraper.router)
app.include_router(resume.router)
app.include_router(outreach.router)
app.include_router(scoring.router)
app.include_router(email_finder.router)
app.include_router(interview.router)
app.include_router(assessment.router)
app.include_router(screening.router)
