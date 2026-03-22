"""Per-source rate limiter: max 1 request per N seconds per source."""

import asyncio
import time
from collections import defaultdict


class RateLimiter:
    """Token-bucket-style rate limiter keyed by source name."""

    def __init__(self, min_interval: float = 3.0):
        self._min_interval = min_interval
        self._last_request: dict[str, float] = defaultdict(float)
        self._locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

    async def acquire(self, source: str) -> None:
        """Wait until the rate limit window for *source* has elapsed."""
        async with self._locks[source]:
            elapsed = time.monotonic() - self._last_request[source]
            if elapsed < self._min_interval:
                await asyncio.sleep(self._min_interval - elapsed)
            self._last_request[source] = time.monotonic()


rate_limiter = RateLimiter(min_interval=3.0)
