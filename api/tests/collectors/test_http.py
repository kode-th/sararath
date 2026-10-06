import asyncio
import time

import httpx
import pytest

from thai_gov_news.collectors.http import RateLimiter, fetch

_real_sleep = asyncio.sleep


async def _run(calls: list, handler) -> httpx.Response:
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        return await fetch(client, "https://retry.go.th/a", {})


def test_retries_then_succeeds(monkeypatch):
    monkeypatch.setattr(asyncio, "sleep", lambda *args: _real_sleep(0))
    calls: list = []

    async def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(500 if len(calls) < 3 else 200, text="ok")

    response = asyncio.run(_run(calls, handler))
    assert response.status_code == 200
    assert len(calls) == 3


def test_no_retry_on_404():
    calls: list = []

    async def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(404)

    response = asyncio.run(_run(calls, handler))
    assert response.status_code == 404
    assert len(calls) == 1


def test_retries_network_error(monkeypatch):
    monkeypatch.setattr(asyncio, "sleep", lambda *args: _real_sleep(0))
    calls: list = []

    async def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        if len(calls) < 3:
            raise httpx.ConnectError("down")
        return httpx.Response(200)

    response = asyncio.run(_run(calls, handler))
    assert response.status_code == 200
    assert len(calls) == 3


def test_raises_after_retries(monkeypatch):
    monkeypatch.setattr(asyncio, "sleep", lambda *args: _real_sleep(0))

    async def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("down")

    async def main() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            await fetch(client, "https://down.go.th/a", {}, retries=1)

    with pytest.raises(httpx.ConnectError):
        asyncio.run(main())


def test_retries_protocol_error(monkeypatch):
    """Server dropping the connection (RemoteProtocolError) must retry."""
    monkeypatch.setattr(asyncio, "sleep", lambda *args: _real_sleep(0))
    calls: list = []

    async def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        if len(calls) < 2:
            raise httpx.RemoteProtocolError(
                "Server disconnected without sending a response."
            )
        return httpx.Response(200)

    response = asyncio.run(_run(calls, handler))
    assert response.status_code == 200
    assert len(calls) == 2


def test_rate_limiter_spacing():
    async def main() -> float:
        limiter = RateLimiter(min_interval=0.05)
        await limiter.wait("https://x.go.th/a")
        start = time.monotonic()
        await limiter.wait("https://x.go.th/b")
        return time.monotonic() - start

    assert asyncio.run(main()) >= 0.04


def test_rate_limiter_per_host():
    async def main() -> float:
        limiter = RateLimiter(min_interval=60.0)
        await limiter.wait("https://x.go.th/a")
        start = time.monotonic()
        await limiter.wait("https://y.go.th/a")
        return time.monotonic() - start

    assert asyncio.run(main()) < 1.0
