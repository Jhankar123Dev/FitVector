from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from src.config import settings

# Paths that bypass service-to-service authentication
_PUBLIC_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}


class ServiceAuthMiddleware(BaseHTTPMiddleware):
    """Validates the X-Internal-Key header on every request except public paths."""

    async def dispatch(self, request: Request, call_next):
        if request.url.path in _PUBLIC_PATHS:
            return await call_next(request)

        internal_key = request.headers.get("X-Internal-Key")
        if not internal_key or internal_key != settings.service_secret:
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid X-Internal-Key header"},
            )

        return await call_next(request)
