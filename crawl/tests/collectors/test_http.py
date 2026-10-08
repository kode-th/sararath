import asyncio
import time

import httpx
import pytest

import sararath.collectors.http as http_module
from sararath.collectors.http import (
    RateLimiter,
    UnsafeUrlError,
    _decoded_headers,
    ensure_public_url,
    fetch,
    should_impersonate,
)

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


def test_should_impersonate_by_host():
    assert should_impersonate("https://www.thaigov.go.th/x", None) is True
    assert should_impersonate("https://www.prd.go.th/x", None) is False
    assert should_impersonate("https://www.prd.go.th/x", True) is True
    assert should_impersonate("https://www.thaigov.go.th/x", False) is False


def test_decoded_headers_strips_encoding():
    """curl_cffi decodes the body, so httpx must not decode it again."""
    headers = {
        "Content-Encoding": "gzip",
        "Content-Length": "123",
        "Content-Type": "text/html",
    }
    assert _decoded_headers(headers) == {"Content-Type": "text/html"}


def test_injected_client_takes_precedence():
    """An explicit httpx client wins even for an impersonate host (tests inject one)."""
    calls: list = []

    async def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(200, text="ok")

    async def main() -> httpx.Response:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await fetch(client, "https://www.thaigov.go.th/x", {})

    response = asyncio.run(main())
    assert response.status_code == 200
    assert len(calls) == 1


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/x",
        "http://[::1]/x",
        "http://10.0.0.1/x",
        "http://192.168.1.10/x",
        "http://169.254.169.254/latest/meta-data/",
        "http://[fe80::1]/x",
        "http://[::ffff:10.0.0.1]/x",
    ],
)
def test_ensure_public_url_blocks_non_public(url):
    with pytest.raises(UnsafeUrlError):
        asyncio.run(ensure_public_url(url))


@pytest.mark.parametrize(
    "url", ["file:///etc/passwd", "ftp://example.com/x", "gopher://x"]
)
def test_ensure_public_url_blocks_non_http_scheme(url):
    with pytest.raises(UnsafeUrlError):
        asyncio.run(ensure_public_url(url))


@pytest.mark.parametrize("url", ["https://93.184.216.34/x", "http://8.8.8.8/x"])
def test_ensure_public_url_allows_public_ip(url):
    assert asyncio.run(ensure_public_url(url)) is None


def test_fetch_rejects_redirect_to_private(monkeypatch):
    monkeypatch.setattr(asyncio, "sleep", lambda *args: _real_sleep(0))
    calls: list = []

    async def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(302, headers={"location": "http://10.0.0.1/secret"})

    async def main() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            await fetch(client, "https://93.184.216.34/a", {})

    with pytest.raises(UnsafeUrlError):
        asyncio.run(main())
    assert len(calls) == 1


def test_fetch_follows_public_redirect():
    calls: list = []

    async def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        if request.url.host == "93.184.216.34":
            return httpx.Response(302, headers={"location": "https://8.8.8.8/final"})
        return httpx.Response(200, text="ok")

    async def main() -> httpx.Response:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await fetch(client, "https://93.184.216.34/a", {})

    response = asyncio.run(main())
    assert response.status_code == 200
    assert response.text == "ok"
    assert len(calls) == 2


def test_fetch_raises_on_too_many_redirects():
    calls: list = []

    async def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(302, headers={"location": "https://8.8.8.8/again"})

    async def main() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            await fetch(client, "https://93.184.216.34/a", {})

    with pytest.raises(UnsafeUrlError):
        asyncio.run(main())
    assert len(calls) == http_module.MAX_REDIRECTS + 1


def test_fetch_rejects_oversized_response(monkeypatch):
    monkeypatch.setattr(http_module, "MAX_RESPONSE_BYTES", 4)

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, content=b"x" * 5)

    async def main() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            await fetch(client, "https://93.184.216.34/a", {}, retries=0)

    with pytest.raises(http_module.ResponseTooLargeError):
        asyncio.run(main())
