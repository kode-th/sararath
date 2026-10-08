import asyncio

import httpx
import pytest

import sararath.collectors.http as http_module
from sararath.collectors.http import (
    DisallowedByRobotsError,
    RobotsCache,
    fetch,
)

ROBOTS_TXT = """
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /customize
"""


def _client(handler) -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


def test_robots_cache_allows_list_denies_api():
    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/robots.txt":
            return httpx.Response(200, text=ROBOTS_TXT)
        return httpx.Response(200, text="ok")

    async def main() -> tuple[bool, bool]:
        cache = RobotsCache()
        async with _client(handler) as client:
            allowed = await cache.allows(client, "https://93.184.216.34/th/news")
            denied = await cache.allows(client, "https://93.184.216.34/api/news")
        return allowed, denied

    assert asyncio.run(main()) == (True, False)


def test_robots_cache_allows_when_absent():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404)

    async def main() -> bool:
        cache = RobotsCache()
        async with _client(handler) as client:
            return await cache.allows(client, "https://93.184.216.34/api/news")

    assert asyncio.run(main()) is True


def test_fetch_raises_for_disallowed(monkeypatch):
    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/robots.txt":
            return httpx.Response(200, text=ROBOTS_TXT)
        return httpx.Response(200, text="ok")

    monkeypatch.setattr(http_module, "ROBOTS", RobotsCache())

    async def main() -> None:
        async with _client(handler) as client:
            await fetch(client, "https://93.184.216.34/api/news", {})

    with pytest.raises(DisallowedByRobotsError):
        asyncio.run(main())


def test_fetch_skips_check_when_disabled(monkeypatch):
    calls: list[str] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        calls.append(str(request.url))
        return httpx.Response(200, text="ok")

    monkeypatch.setattr(http_module, "ROBOTS", RobotsCache())

    async def main() -> httpx.Response:
        async with _client(handler) as client:
            return await fetch(
                client, "https://93.184.216.34/api/news", {}, check_robots=False
            )

    assert asyncio.run(main()).status_code == 200
    assert calls == ["https://93.184.216.34/api/news"]
