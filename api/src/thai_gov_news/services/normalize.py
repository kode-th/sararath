"""Normalization: whitespace, URLs, Thai dates. stdlib only."""

from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime
from typing import Any, TypedDict
from urllib.parse import urlparse, urlunparse

from thai_gov_news.services.thai_date import parse_thai_date


class NormalizedRecord(TypedDict):
    external_id: str
    canonical_url: str
    title: str
    body_text: str
    language: str
    category: str
    agency_name: str
    published_raw: str
    published_at: datetime | None


def normalize_whitespace(text: str) -> str:
    return " ".join((text or "").split())


def normalize_body(text: str) -> str:
    """Collapse per-line whitespace but keep paragraph and line breaks."""
    lines = [" ".join(line.split()) for line in (text or "").splitlines()]
    out: list[str] = []
    for line in lines:
        if line:
            out.append(line)
        elif out and out[-1] != "":
            out.append("")
    while out and out[-1] == "":
        out.pop()
    return "\n".join(out)


def normalize_url(url: str) -> str:
    parsed = urlparse((url or "").strip())
    scheme = parsed.scheme.lower()
    host = (parsed.hostname or "").lower()
    if not scheme or not host:
        return (url or "").strip()
    netloc = host
    if parsed.port and parsed.port not in (80, 443):
        netloc += f":{parsed.port}"
    if parsed.username:
        auth = parsed.username
        if parsed.password:
            auth += f":{parsed.password}"
        netloc = f"{auth}@{netloc}"
    path = parsed.path.rstrip("/") or "/"
    return urlunparse((scheme, netloc, path, "", parsed.query, ""))


def _field(raw: Mapping[str, Any], *names: str, default: str = "") -> str:
    for name in names:
        value = raw.get(name)
        if value:
            return normalize_whitespace(str(value))
    return default


def normalize_record(raw: Mapping[str, Any]) -> NormalizedRecord:
    published_raw = _field(raw, "published_raw", "published_at")
    published_at = raw.get("published_at")
    if not isinstance(published_at, datetime):
        published_at = parse_thai_date(published_raw)
    body = raw.get("body_text") or raw.get("content") or ""
    return {
        "external_id": _field(raw, "external_id", "id"),
        "canonical_url": normalize_url(_field(raw, "canonical_url", "source_url")),
        "title": _field(raw, "title"),
        "body_text": normalize_body(str(body)),
        "language": _field(raw, "language", default="th"),
        "category": _field(raw, "category", "topic"),
        "agency_name": _field(raw, "agency_name", "agency"),
        "published_raw": published_raw,
        "published_at": published_at,
    }
