"""PRD collector: ข่าวภาครัฐ articles from the prd.go.th CMS.

The site moved from ``www.prd.go.th`` (HTML cards, ``/th/content/category``
paths) to a Next.js + Supabase CMS at the apex ``prd.go.th``. Article bodies are
embedded in each article page's ``__NEXT_DATA__``; the listing comes from the
CMS JSON API, which scopes content by the ``currentHost`` cookie.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx
from selectolax.lexbor import LexborHTMLParser

from sararath.collectors.base import DiscoveredItem, ParsedArticle, RawArticle
from sararath.collectors.html import html_to_text, strip_trailing_attribution
from sararath.collectors.http import USER_AGENT
from sararath.collectors.http import fetch as http_fetch

BASE = "https://prd.go.th"
LIST_API = f"{BASE}/api/article"
ARTICLE_URL = f"{BASE}/main/article"
IMAGE_BASE = "https://api-supabase.prd.softsq.com/storage/v1/object/public/cms-softsq"
# CMS article group "ข่าวภาครัฐ" (Image group).
GROUP_ID = "45c3c02d-a39e-44ed-b0f1-99fa7d83a065"
PAGE_SIZE = 20
# The CMS API returns an empty list unless the request looks same-site.
HEADERS = {"User-Agent": USER_AGENT, "Referer": f"{BASE}/main"}
AGENCY = "กรมประชาสัมพันธ์"
CATEGORY = "ข่าวภาครัฐ"
LANGUAGE = "th"


def list_url(page: int = 1) -> str:
    query = urlencode(
        {
            "page": page,
            "limit": PAGE_SIZE,
            "group_id": GROUP_ID,
            "include_page_count": "true",
            "isBff": "true",
        }
    )
    return f"{LIST_API}?{query}"


def discover_from_json(payload: dict) -> list[DiscoveredItem]:
    items: list[DiscoveredItem] = []
    seen: set[str] = set()
    for row in payload.get("items", []):
        article_id = row.get("id")
        if not article_id or article_id in seen:
            continue
        seen.add(article_id)
        items.append(
            DiscoveredItem(
                external_id=f"prd-{article_id}",
                url=f"{ARTICLE_URL}/{article_id}",
                published_raw=row.get("start_date"),
            )
        )
    return items


def _parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _next_data(html: str) -> dict:
    node = LexborHTMLParser(html).css_first("script#__NEXT_DATA__")
    text = node.text() if node is not None else None
    if not text:
        return {}
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {}


def _image_urls(article: dict, gallery: object) -> tuple[str, ...]:
    names: list[str] = []
    cover = article.get("cover_image")
    if isinstance(cover, dict) and cover.get("system_name"):
        names.append(str(cover["system_name"]))
    if isinstance(gallery, list):
        for entry in gallery:
            if isinstance(entry, dict) and entry.get("system_name"):
                names.append(str(entry["system_name"]))
    return tuple(f"{IMAGE_BASE}/{name}" for name in dict.fromkeys(names))


def parse_article(html: str, url: str) -> ParsedArticle:
    page = _next_data(html).get("props", {}).get("pageProps") or {}
    article = page.get("article") or {}
    article_id = article.get("id")
    if not article_id:
        article_id = url.rstrip("/").rsplit("/", 1)[-1]
    start = article.get("start_date")
    return ParsedArticle(
        external_id=f"prd-{article_id}",
        canonical_url=url,
        title=(article.get("name_thai") or "").strip(),
        summary="",
        body_text=strip_trailing_attribution(
            html_to_text(article.get("detail_thai") or "")
        ),
        language=LANGUAGE,
        category=CATEGORY,
        agency_name=AGENCY,
        published_at=_parse_iso(start),
        published_raw=start or "",
        attachments=_image_urls(article, page.get("articleGallery")),
    )


class PrdCollector:
    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client

    async def discover(self) -> list[DiscoveredItem]:
        response = await http_fetch(self._client, list_url(), HEADERS)
        response.raise_for_status()
        return discover_from_json(response.json())

    async def fetch(self, item: DiscoveredItem) -> RawArticle:
        response = await http_fetch(self._client, item.url, HEADERS)
        return RawArticle(
            url=item.url,
            status=response.status_code,
            html=response.text,
            retrieved_at=datetime.now(timezone.utc),
            final_url=str(response.url),
        )

    def parse(self, raw: RawArticle) -> ParsedArticle:
        return parse_article(raw.html, raw.final_url or raw.url)
