import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.middleware import ServiceAuthMiddleware
from src.routers import health, scraper, resume, outreach, scoring, email_finder

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(ServiceAuthMiddleware)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(scraper.router)
app.include_router(resume.router)
app.include_router(outreach.router)
app.include_router(scoring.router)
app.include_router(email_finder.router)
