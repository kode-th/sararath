"""Shared fetch: per-host rate limit + retry with backoff.

Default transport is httpx. Hosts in ``IMPERSONATE_HOSTS`` are fetched with
curl_cffi's Chrome impersonation (a browser-like TLS/HTTP2 fingerprint) to get
past bot checks that reject plain clients. A call that passes an explicit httpx
client always uses it, so tests can inject a MockTransport client.
"""

from __future__ import annotations

import asyncio
import ipaddress
import os
import socket
import time
from collections.abc import Mapping
from urllib.parse import quote, urlsplit
from urllib.robotparser import RobotFileParser

import httpx

# curl_cffi already decompressed the body; keep httpx from decoding it again.
_DECODED_HEADERS = frozenset({"content-encoding", "content-length"})


def _decoded_headers(headers: Mapping[str, str | None]) -> dict[str, str]:
    return {
        key: value
        for key, value in headers.items()
        if value is not None and key.lower() not in _DECODED_HEADERS
    }


_RETRIE: tuple[type[BaseException], ...] = (
    TimeoutError,
    httpx.TimeoutException,
    httpx.NetworkError,
    httpx.ProtocolError,
)

MIN_INTERVAL = 2.0
TIMEOUT = 15.0
RETRIES = 3
MAX_REDIRECTS = 3
MAX_RESPONSE_BYTES = 10 * 1024 * 1024
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 ThaiGovNewsBot/1.0"
)

# Hosts that fingerprint-block plain clients; fetched with a Chrome profile.
IMPERSONATE_HOSTS: frozenset[str] = frozenset({"www.thaigov.go.th"})
IMPERSONATE = "chrome"


def impersonate_proxy(env: Mapping[str, str] = os.environ) -> str | None:
    """Residential proxy for impersonated hosts, which 403 datacenter IPs."""
    keys = ("PROXY_LOGIN", "PROXY_PASSWORD", "PROXY_HOST", "PROXY_PORT")
    if not all(env.get(key) for key in keys):
        return None
    login, password, host, port = (env[key] for key in keys)
    return f"http://{quote(login, safe='')}:{quote(password, safe='')}@{host}:{port}"


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


def should_impersonate(url: str, impersonate: bool | None) -> bool:
    if impersonate is not None:
        return impersonate
    host = (urlsplit(url).hostname or "").lower()
    return host in IMPERSONATE_HOSTS


class UnsafeUrlError(Exception):
    """A URL that cannot be fetched safely: bad scheme or non-public host."""


class ResponseTooLargeError(httpx.HTTPError):
    """A response body exceeded ``MAX_RESPONSE_BYTES``."""


def _is_blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped is not None:
        ip = ip.ipv4_mapped
    return not ip.is_global


async def _resolve_ips(host: str) -> set[str] | None:
    try:
        infos = await asyncio.to_thread(
            socket.getaddrinfo, host, None, type=socket.SOCK_STREAM
        )
    except OSError:
        return None
    return {str(info[4][0]) for info in infos}


async def ensure_public_url(url: str) -> None:
    """Reject non-http(s) URLs and hosts that resolve to non-public addresses."""
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https"):
        raise UnsafeUrlError(f"unsupported scheme {parts.scheme!r}")
    host = parts.hostname
    if not host:
        raise UnsafeUrlError("missing host")
    try:
        literal = ipaddress.ip_address(host)
    except ValueError:
        literal = None
    if literal is not None:
        if _is_blocked(literal):
            raise UnsafeUrlError(f"blocked address {host}")
        return
    resolved = await _resolve_ips(host)
    if resolved is None:
        # Names that do not resolve cannot connect; leave the failure to httpx.
        return
    for address in resolved:
        try:
            resolved_ip = ipaddress.ip_address(address)
        except ValueError:
            raise UnsafeUrlError(f"unparsable address for {host}") from None
        if _is_blocked(resolved_ip):
            raise UnsafeUrlError(f"blocked address {address} for {host}")


# Sources whose robots.txt disallows a path we still crawl. Each entry is an
# audited exception; the value is the reason. Keep this list tiny.
ROBOTS_OVERRIDES: dict[str, str] = {
    "thaigov": (
        "news list is only served by /api/, which robots.txt disallows; it is a "
        "public read API the site's own frontend calls"
    ),
}


class DisallowedByRobotsError(Exception):
    """A URL that the host's robots.txt forbids for our user agent."""


class RobotsCache:
    """Per-origin robots.txt, fetched once and evaluated per URL."""

    def __init__(self) -> None:
        self._by_origin: dict[str, RobotFileParser | None] = {}

    async def allows(self, client: httpx.AsyncClient | None, url: str) -> bool:
        parts = urlsplit(url)
        origin = f"{parts.scheme}://{parts.netloc}"
        if origin not in self._by_origin:
            self._by_origin[origin] = await self._load(client, origin)
        parser = self._by_origin[origin]
        return True if parser is None else parser.can_fetch(USER_AGENT, url)

    async def _load(
        self, client: httpx.AsyncClient | None, origin: str
    ) -> RobotFileParser | None:
        robots_url = f"{origin}/robots.txt"
        await ensure_public_url(robots_url)
        headers = {"User-Agent": USER_AGENT}
        try:
            if client is not None:
                response = await client.get(robots_url, headers=headers)
            else:
                async with httpx.AsyncClient() as owned:
                    response = await owned.get(
                        robots_url, headers=headers, timeout=TIMEOUT
                    )
        except httpx.HTTPError:
            return None
        if response.status_code != 200:
            return None
        parser = RobotFileParser()
        parser.parse(response.text.splitlines())
        return parser


ROBOTS = RobotsCache()


def _redirect_target(response: httpx.Response, current: str) -> str | None:
    location = response.headers.get("location")
    if not location:
        return None
    return str(httpx.URL(current).join(location))


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
    impersonate: bool | None = None,
    check_robots: bool = True,
) -> httpx.Response:
    if check_robots and not await ROBOTS.allows(client, url):
        raise DisallowedByRobotsError(f"robots.txt disallows {url}")
    await limiter.wait(url)
    if client is not None:
        return await _fetch_following(client, url, headers, retries)
    if should_impersonate(url, impersonate):
        return await _fetch_cffi_following(url, headers, retries)
    async with httpx.AsyncClient() as owned:
        return await _fetch_following(owned, url, headers, retries)


async def open_stream(
    client: httpx.AsyncClient,
    url: str,
    headers: dict[str, str],
) -> httpx.Response:
    """Open a validated GET stream, following redirects. Caller closes it."""
    current = url
    for _ in range(MAX_REDIRECTS + 1):
        await ensure_public_url(current)
        request = client.build_request("GET", current, headers=headers)
        response = await client.send(request, stream=True)
        if not response.is_redirect:
            return response
        target = _redirect_target(response, current)
        await response.aclose()
        if target is None:
            raise UnsafeUrlError("redirect without location")
        current = target
    raise UnsafeUrlError("too many redirects")


async def _fetch_following(
    client: httpx.AsyncClient,
    url: str,
    headers: dict[str, str],
    retries: int,
) -> httpx.Response:
    current = url
    for _ in range(MAX_REDIRECTS + 1):
        await ensure_public_url(current)
        response = await _fetch_with_retry(client, current, headers, retries)
        if not response.is_redirect:
            return response
        target = _redirect_target(response, current)
        if target is None:
            return response
        current = target
    raise UnsafeUrlError("too many redirects")


async def _get_capped(
    client: httpx.AsyncClient,
    url: str,
    headers: dict[str, str],
) -> httpx.Response:
    async with client.stream("GET", url, headers=headers) as response:
        declared = response.headers.get("content-length")
        if (
            declared is not None
            and declared.isdigit()
            and int(declared) > MAX_RESPONSE_BYTES
        ):
            raise ResponseTooLargeError(f"{url} exceeds {MAX_RESPONSE_BYTES} bytes")
        chunks: list[bytes] = []
        total = 0
        async for chunk in response.aiter_bytes():
            total += len(chunk)
            if total > MAX_RESPONSE_BYTES:
                raise ResponseTooLargeError(f"{url} exceeds {MAX_RESPONSE_BYTES} bytes")
            chunks.append(chunk)
        return httpx.Response(
            status_code=response.status_code,
            headers=_decoded_headers(response.headers),
            content=b"".join(chunks),
            request=response.request,
        )


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
                response = await _get_capped(client, url, headers)
        except _RETRIE:
            if attempt >= retries:
                raise
        else:
            if _done(response.status_code, attempt, retries):
                return response
        await asyncio.sleep(delay)
        delay *= 2
    raise AssertionError("unreachable")


async def _fetch_cffi_following(
    url: str,
    headers: dict[str, str],
    retries: int,
) -> httpx.Response:
    current = url
    for _ in range(MAX_REDIRECTS + 1):
        await ensure_public_url(current)
        response = await _fetch_cffi(current, headers, retries)
        if not response.is_redirect:
            return response
        target = _redirect_target(response, current)
        if target is None:
            return response
        current = target
    raise UnsafeUrlError("too many redirects")


async def _fetch_cffi(
    url: str,
    headers: dict[str, str],
    retries: int,
) -> httpx.Response:
    # Imported lazily so the httpx-only paths (and tests) don't need the native lib.
    from curl_cffi.requests import AsyncSession
    from curl_cffi.requests.errors import CurlError, RequestsError

    errors = (TimeoutError, CurlError, RequestsError)
    delay = 1.0
    for attempt in range(retries + 1):
        try:
            async with (
                asyncio.timeout(TIMEOUT),
                AsyncSession() as session,
            ):
                response = await session.get(
                    url,
                    headers=headers,
                    impersonate=IMPERSONATE,
                    allow_redirects=False,
                    proxy=impersonate_proxy(),
                )
        except errors:
            if attempt >= retries:
                raise
        else:
            if _done(response.status_code, attempt, retries):
                if len(response.content) > MAX_RESPONSE_BYTES:
                    raise ResponseTooLargeError(
                        f"{url} exceeds {MAX_RESPONSE_BYTES} bytes"
                    )
                return httpx.Response(
                    status_code=response.status_code,
                    headers=_decoded_headers(response.headers),
                    content=response.content,
                    request=httpx.Request("GET", str(response.url)),
                )
        await asyncio.sleep(delay)
        delay *= 2
    raise AssertionError("unreachable")
