"""Generic RSS collector: feedparser parses, we map to contract."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import cast
from urllib.parse import urljoin
from collections.abc import Callable

import feedparser
import httpx
from selectolax.lexbor import LexborHTMLParser

from sararath.collectors.base import DiscoveredItem, ParsedArticle, RawArticle
from sararath.collectors.http import USER_AGENT
from sararath.collectors.http import fetch as http_fetch
from sararath.domain.normalize import normalize_whitespace
from sararath.domain.thai_date import parse_thai_date


@dataclass(frozen=True)
class FeedConfig:
    slug: str
    feed_url: str
    agency_name: str
    category: str
    language: str = "th"
    link_normalizer: Callable[[str], str] | None = None


def _entry_id(entry: feedparser.FeedParserDict, index: int, slug: str) -> str:
    raw = entry.get("id", "") or entry.get("guid", "") or entry.get("link", "")
    return f"{slug}-{raw or index}"


def _published(entry: feedparser.FeedParserDict, raw_date: str) -> datetime | None:
    thai = parse_thai_date(raw_date)
    if thai is not None:
        return thai
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed is None:
        return None
    try:
        return datetime(*parsed[:6], tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None


def _entries(payload: str | bytes) -> list[feedparser.FeedParserDict]:
    feed = feedparser.parse(payload)
    return cast("list[feedparser.FeedParserDict]", feed.get("entries", []))


def _html_parts(entry: feedparser.FeedParserDict) -> list[str]:
    content = [str(c.get("value", "")) for c in entry.get("content", [])]
    return [str(entry.get("summary", entry.get("description", ""))), *content]


def _image(parts: list[str], base: str) -> str:
    for html in parts:
        img = LexborHTMLParser(html).css_first("img[src]")
        if img is not None:
            return urljoin(base, str(img.attributes.get("src") or ""))
    return ""


def _body(parts: list[str]) -> str:
    texts = [normalize_whitespace(LexborHTMLParser(html).text()) for html in parts]
    return max(texts, key=len, default="")


def parse_feed(payload: str | bytes, config: FeedConfig) -> list[ParsedArticle]:
    articles: list[ParsedArticle] = []
    for index, entry in enumerate(_entries(payload)):
        link = normalize_whitespace(str(entry.get("link", "")))
        title = normalize_whitespace(str(entry.get("title", "")))
        if not title or not link:
            continue
        url = urljoin(config.feed_url, link)
        if config.link_normalizer is not None:
            url = config.link_normalizer(url)
        parts = _html_parts(entry)
        image = _image(parts, url)
        raw_date = normalize_whitespace(
            str(entry.get("published", entry.get("updated", "")))
        )
        articles.append(
            ParsedArticle(
                external_id=_entry_id(entry, index, config.slug),
                canonical_url=url,
                title=title,
                summary="",
                body_text=_body(parts),
                language=config.language,
                category=config.category,
                agency_name=config.agency_name,
                published_at=_published(entry, raw_date),
                published_raw=raw_date,
                attachments=(image,) if image.startswith("http") else (),
            )
        )
    return articles


class RssCollector:
    """Feed-level collector: items come from feed, not per-article fetch."""

    def __init__(
        self, config: FeedConfig, client: httpx.AsyncClient | None = None
    ) -> None:
        self._config = config
        self._client = client

    async def discover(self) -> list[DiscoveredItem]:
        raw = await self.fetch_raw()
        return [
            DiscoveredItem(external_id=a.external_id, url=a.canonical_url)
            for a in parse_feed(raw.html, self._config)
        ]

    async def fetch_raw(self) -> RawArticle:
        url = self._config.feed_url
        response = await http_fetch(self._client, url, {"User-Agent": USER_AGENT})
        response.raise_for_status()
        return RawArticle(
            url=url,
            status=response.status_code,
            html=response.text,
            retrieved_at=datetime.now(timezone.utc),
            final_url=str(response.url),
        )
