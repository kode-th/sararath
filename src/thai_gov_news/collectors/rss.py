"""Generic RSS collector: feedparser parses, we map to contract."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import cast
from urllib.parse import urljoin

import feedparser
import httpx

from thai_gov_news.collectors.base import DiscoveredItem, ParsedArticle, RawArticle
from thai_gov_news.services.normalize import normalize_whitespace
from thai_gov_news.services.thai_date import parse_thai_date

USER_AGENT = "ThaiGovNewsBot/1.0 (+research)"


@dataclass(frozen=True)
class FeedConfig:
    slug: str
    feed_url: str
    agency_name: str
    category: str
    language: str = "th"


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


def parse_feed(payload: str | bytes, config: FeedConfig) -> list[ParsedArticle]:
    articles: list[ParsedArticle] = []
    for index, entry in enumerate(_entries(payload)):
        link = normalize_whitespace(str(entry.get("link", "")))
        title = normalize_whitespace(str(entry.get("title", "")))
        if not title or not link:
            continue
        body = normalize_whitespace(
            str(entry.get("summary", entry.get("description", "")))
        )
        raw_date = normalize_whitespace(
            str(entry.get("published", entry.get("updated", "")))
        )
        articles.append(
            ParsedArticle(
                external_id=_entry_id(entry, index, config.slug),
                canonical_url=urljoin(config.feed_url, link),
                title=title,
                summary="",
                body_text=body,
                language=config.language,
                category=config.category,
                agency_name=config.agency_name,
                published_at=_published(entry, raw_date),
                published_raw=raw_date,
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
        headers = {"User-Agent": USER_AGENT}
        url = self._config.feed_url
        if self._client is not None:
            response = await self._client.get(url, headers=headers, timeout=15)
        else:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                response = await client.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return RawArticle(
            url=url,
            status=response.status_code,
            html=response.text,
            retrieved_at=datetime.now(timezone.utc),
            final_url=str(response.url),
        )
