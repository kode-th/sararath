"""PRD collector: ข่าวภาครัฐ listing + article pages. selectolax parsing."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from urllib.parse import urljoin

import httpx
from selectolax.parser import HTMLParser, Node

from thai_gov_news.collectors.base import DiscoveredItem, ParsedArticle, RawArticle
from thai_gov_news.services.normalize import normalize_whitespace
from thai_gov_news.services.thai_date import parse_thai_date

BASE = "https://www.prd.go.th"
LIST_URL = f"{BASE}/th/content/category/index/id/39"
AGENCY = "กรมประชาสัมพันธ์"
CATEGORY = "ข่าวภาครัฐ"
LANGUAGE = "th"
USER_AGENT = "ThaiGovNewsBot/1.0 (+research)"

_DETAIL_RE = re.compile(r"/th/content/category/detail/id/\d+/iid/(?P<iid>\d+)")


def _text(node: HTMLParser | Node, selector: str) -> str:
    found = node.css_first(selector)
    return normalize_whitespace(found.text() if found else "")


def discover_from_html(html: str, base: str = BASE) -> list[DiscoveredItem]:
    items: list[DiscoveredItem] = []
    seen: set[str] = set()
    for card in HTMLParser(html).css(".infocard"):
        link = card.css_first('a[title][href*="/iid/"]')
        if link is None:
            continue
        href = str(link.attributes.get("href", ""))
        match = _DETAIL_RE.search(href)
        if match is None:
            continue
        iid = match.group("iid")
        if iid in seen:
            continue
        seen.add(iid)
        date = _text(card, "a.detail-publish") or None
        items.append(
            DiscoveredItem(
                external_id=f"prd-{iid}",
                url=urljoin(base, href),
                published_raw=date,
            )
        )
    return items


def parse_article(html: str, url: str) -> ParsedArticle:
    tree = HTMLParser(html)
    title = _text(tree, ".article-title .title") or _text(tree, "title")
    date = _text(tree, ".article-date-date").split("|")[0].strip()
    body = _text(tree, ".article-detail")
    match = _DETAIL_RE.search(url)
    external_id = f"prd-{match.group('iid')}" if match else url
    return ParsedArticle(
        external_id=external_id,
        canonical_url=url,
        title=title,
        summary="",
        body_text=body,
        language=LANGUAGE,
        category=CATEGORY,
        agency_name=AGENCY,
        published_at=parse_thai_date(date),
        published_raw=date,
    )


class PrdCollector:
    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client

    async def discover(self) -> list[DiscoveredItem]:
        html = await self._get(LIST_URL)
        return discover_from_html(html)

    async def fetch(self, item: DiscoveredItem) -> RawArticle:
        response = await self._get_response(item.url)
        return RawArticle(
            url=item.url,
            status=response.status_code,
            html=response.text,
            retrieved_at=datetime.now(timezone.utc),
            final_url=str(response.url),
        )

    def parse(self, raw: RawArticle) -> ParsedArticle:
        return parse_article(raw.html, raw.final_url or raw.url)

    async def _get(self, url: str) -> str:
        response = await self._get_response(url)
        response.raise_for_status()
        return response.text

    async def _get_response(self, url: str) -> httpx.Response:
        headers = {"User-Agent": USER_AGENT}
        if self._client is not None:
            return await self._client.get(url, headers=headers, timeout=15)
        async with httpx.AsyncClient(follow_redirects=True) as client:
            return await client.get(url, headers=headers, timeout=15)
