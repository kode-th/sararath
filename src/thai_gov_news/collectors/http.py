"""Shared fetch: per-host rate limit + retry with backoff."""

from __future__ import annotations

import asyncio
import time
from urllib.parse import urlsplit

import httpx

_RETRIE: tuple[type[BaseException], ...] = (
    TimeoutError,
    httpx.TimeoutException,
    httpx.NetworkError,
    httpx.ProtocolError,
)

MIN_INTERVAL = 2.0
TIMEOUT = 15.0
RETRIES = 3
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 ThaiGovNewsBot/1.0"
)


class RateLimiter:
    def __init__(self, min_interval: float = MIN_INTERVAL) -> None:
        self._min_interval = min_interval
        self._last: dict[str, float] = {}
        self._lock = asyncio.Lock()

    async def wait(self, url: str) -> None:
        host = (urlsplit(url).hostname or "").lower()
        async with self._lock:
            now = time.monotonic()
            delay = self._min_interval - (now - self._last.get(host, 0.0))
            self._last[host] = now + max(0.0, delay)
        if delay > 0:
            await asyncio.sleep(delay)


limiter = RateLimiter()


def _retriable_status(status: int) -> bool:
    return status == 429 or status >= 500


def _done(status: int, attempt: int, retries: int) -> bool:
    if status < 400 or not _retriable_status(status):
        return True
    return attempt >= retries


async def fetch(
    client: httpx.AsyncClient | None,
    url: str,
    headers: dict[str, str],
    retries: int = RETRIES,
) -> httpx.Response:
    await limiter.wait(url)
    if client is None:
        async with httpx.AsyncClient(follow_redirects=True) as owned:
            return await _fetch_with_retry(owned, url, headers, retries)
    return await _fetch_with_retry(client, url, headers, retries)


async def _fetch_with_retry(
    client: httpx.AsyncClient,
    url: str,
    headers: dict[str, str],
    retries: int,
) -> httpx.Response:
    delay = 1.0
    for attempt in range(retries + 1):
        try:
            async with asyncio.timeout(TIMEOUT):
                response = await client.get(url, headers=headers)
        except _RETRIE:
            if attempt >= retries:
                raise
        else:
            if _done(response.status_code, attempt, retries):
                return response
        await asyncio.sleep(delay)
        delay *= 2
    raise AssertionError("unreachable")
