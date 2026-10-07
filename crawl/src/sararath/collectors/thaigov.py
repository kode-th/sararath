"""Thaigov collector: JSON list + detail via same-origin proxy API."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from selectolax.lexbor import LexborHTMLParser

from sararath.collectors.base import DiscoveredItem, ParsedArticle, RawArticle
from sararath.collectors.html import html_to_text
from sararath.collectors.http import USER_AGENT
from sararath.collectors.http import fetch as http_fetch
from sararath.domain.normalize import normalize_whitespace
from sararath.domain.thai_date import parse_thai_date

BASE = "https://www.thaigov.go.th"
LIST_API = f"{BASE}/api/proxy/v1/news/th"
AGENCY = "รัฐบาลไทย"
LANGUAGE = "th"

_ID_RE = re.compile(r"/th/news/(?P<id>\d+)")


def list_url(page: int = 1, per_page: int = 20) -> str:
    return f"{LIST_API}?page={page}&per_page={per_page}"


def detail_url(item_id: str | int) -> str:
    return f"{LIST_API}/{item_id}"


def _item_id(item: DiscoveredItem) -> str:
    match = _ID_RE.search(item.url)
    if match is not None:
        return match.group("id")
    return item.external_id.removeprefix("thaigov-")


def discover_from_payload(
    payload: dict[str, Any], base: str = BASE
) -> list[DiscoveredItem]:
    items: list[DiscoveredItem] = []
    seen: set[str] = set()
    data = payload.get("data")
    if not isinstance(data, list):
        return items
    for entry in data:
        if not isinstance(entry, dict):
            continue
        raw_id = entry.get("id")
        if raw_id is None:
            continue
        external_id = f"thaigov-{raw_id}"
        if external_id in seen:
            continue
        seen.add(external_id)
        published = entry.get("published_at")
        items.append(
            DiscoveredItem(
                external_id=external_id,
                url=f"{base}/th/news/{raw_id}",
                published_raw=str(published) if published else None,
            )
        )
    return items


def _body_text(description_html: str) -> str:
    return html_to_text(description_html)


def _images(description_html: str, thumbnail: str) -> tuple[str, ...]:
    urls = [thumbnail] if thumbnail.startswith("http") else []
    for img in LexborHTMLParser(description_html or "").css("img[src]"):
        src = str(img.attributes.get("src") or "")
        if src.startswith("http"):
            urls.append(src)
    seen: set[str] = set()
    out: list[str] = []
    for url in urls:
        if url not in seen:
            seen.add(url)
            out.append(url)
    return tuple(out)


def parse_detail(payload: dict[str, Any], url: str) -> ParsedArticle:
    raw_id = payload.get("id", "")
    external_id = f"thaigov-{raw_id}" if raw_id != "" else url
    published_raw = normalize_whitespace(str(payload.get("published_at", "")))
    thumbnail = normalize_whitespace(str(payload.get("thumbnail", "")))
    return ParsedArticle(
        external_id=external_id,
        canonical_url=url,
        title=normalize_whitespace(str(payload.get("title", ""))),
        summary=normalize_whitespace(str(payload.get("short_description", ""))),
        body_text=_body_text(str(payload.get("description", ""))),
        language=LANGUAGE,
        category=normalize_whitespace(str(payload.get("category", ""))),
        agency_name=AGENCY,
        published_at=parse_thai_date(published_raw),
        published_raw=published_raw,
        attachments=_images(str(payload.get("description", "")), thumbnail),
    )


class ThaigovCollector:
    def __init__(
        self,
        client: httpx.AsyncClient | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> None:
        self._client = client
        self._page = page
        self._per_page = per_page

    async def discover(self) -> list[DiscoveredItem]:
        text = await self._get(list_url(self._page, self._per_page))
        payload = json.loads(text)
        if not isinstance(payload, dict):
            return []
        return discover_from_payload(payload)

    async def fetch(self, item: DiscoveredItem) -> RawArticle:
        url = detail_url(_item_id(item))
        response = await self._get_response(url)
        return RawArticle(
            url=item.url,
            status=response.status_code,
            html=response.text,
            retrieved_at=datetime.now(timezone.utc),
            final_url=item.url,
        )

    def parse(self, raw: RawArticle) -> ParsedArticle:
        payload = json.loads(raw.html)
        return parse_detail(payload, raw.final_url or raw.url)

    async def _get(self, url: str) -> str:
        response = await self._get_response(url)
        response.raise_for_status()
        return response.text

    async def _get_response(self, url: str) -> httpx.Response:
        headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
        return await http_fetch(self._client, url, headers)
