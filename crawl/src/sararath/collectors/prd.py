"""PRD collector: ข่าวภาครัฐ listing + article pages. selectolax parsing."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from urllib.parse import urljoin

import httpx
from selectolax.lexbor import LexborHTMLParser, LexborNode

from sararath.collectors.base import DiscoveredItem, ParsedArticle, RawArticle
from sararath.collectors.html import html_to_text, strip_trailing_attribution
from sararath.collectors.http import USER_AGENT
from sararath.collectors.http import fetch as http_fetch
from sararath.domain.normalize import normalize_whitespace
from sararath.domain.thai_date import parse_thai_date

BASE = "https://www.prd.go.th"
LIST_URL = f"{BASE}/th/content/category/index/id/39"
AGENCY = "กรมประชาสัมพันธ์"
CATEGORY = "ข่าวภาครัฐ"
LANGUAGE = "th"

_DETAIL_RE = re.compile(r"/th/content/category/detail/id/\d+/iid/(?P<iid>\d+)")


def _text(node: LexborHTMLParser | LexborNode, selector: str) -> str:
    found = node.css_first(selector)
    return normalize_whitespace(found.text() if found else "")


def _body_text(tree: LexborHTMLParser) -> str:
    """Article body as paragraphs, without title/date chrome or source credit."""
    nodes = tree.css(".article-detail")
    if not nodes:
        return ""
    return strip_trailing_attribution(html_to_text(nodes[-1].html or ""))


def discover_from_html(html: str, base: str = BASE) -> list[DiscoveredItem]:
    items: list[DiscoveredItem] = []
    seen: set[str] = set()
    for card in LexborHTMLParser(html).css(".infocard"):
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


def _images(tree: LexborHTMLParser, url: str) -> tuple[str, ...]:
    urls: list[str] = []
    og = tree.css_first('meta[property="og:image"]')
    if og is not None and og.attributes.get("content"):
        urls.append(str(og.attributes["content"]).strip())
    gallery = tree.css_first(".article-gallery")
    if gallery is not None:
        for img in gallery.css("img[src]"):
            src = str(img.attributes.get("src") or "")
            if src and "/images/icons/" not in src:
                urls.append(urljoin(url, src))
    seen: set[str] = set()
    out: list[str] = []
    for image in urls:
        if not image.startswith("http"):
            continue
        # Gallery links are thumbnails; the full-size file drops `type/thumbnail`.
        full = image.replace("/type/thumbnail/", "/", 1)
        if full not in seen:
            seen.add(full)
            out.append(full)
    return tuple(out)


def parse_article(html: str, url: str) -> ParsedArticle:
    tree = LexborHTMLParser(html)
    title = _text(tree, ".article-title .title") or _text(tree, "title")
    date = _text(tree, ".article-date-date").split("|")[0].strip()
    body = _body_text(tree)
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
        attachments=_images(tree, url),
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
        return await http_fetch(self._client, url, {"User-Agent": USER_AGENT})
