"""Crawl runner: collect -> ingest -> store. One source per run."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from thai_gov_news.collectors.base import ParsedArticle
from thai_gov_news.collectors.prd import PrdCollector
from thai_gov_news.collectors.rss import FeedConfig, RssCollector, parse_feed
from thai_gov_news.models import Article, CollectorRun, Source
from thai_gov_news.services.dedupe import content_hash
from thai_gov_news.services.ingest import ingest


@dataclass(frozen=True)
class CrawlResult:
    source: str
    found: int
    inserted: int
    skipped: int


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _collect_prd() -> list[ParsedArticle]:
    collector = PrdCollector()
    parsed: list[ParsedArticle] = []
    for item in await collector.discover():
        raw = await collector.fetch(item)
        if raw.status != 200:
            continue
        parsed.append(collector.parse(raw))
    return parsed


async def _collect_rss(source: Source) -> list[ParsedArticle]:
    config = FeedConfig(
        slug=source.slug,
        feed_url=str(source.feed_url or ""),
        agency_name=source.name_th,
        category=source.category,
    )
    collector = RssCollector(config)
    raw = await collector.fetch_raw()
    return parse_feed(raw.html, config)


async def _collect(source: Source) -> list[ParsedArticle]:
    if source.collector == "prd":
        return await _collect_prd()
    if source.collector == "rss":
        return await _collect_rss(source)
    raise SystemExit(f"error: collector {source.collector!r} not implemented")


def run_crawl(session: Session, slug: str) -> CrawlResult:
    source = session.scalar(select(Source).where(Source.slug == slug))
    if source is None:
        raise SystemExit(f"error: unknown source {slug!r}, run seed first")
    source.last_attempt_at = _utcnow()
    session.commit()

    started = _utcnow()
    try:
        parsed = asyncio.run(_collect(source))
    except SystemExit:
        raise
    except Exception as exc:
        source.last_error = str(exc)[:1000]
        session.add(
            CollectorRun(
                source_id=source.id,
                started_at=started,
                finished_at=_utcnow(),
                status="error",
                error=str(exc)[:1000],
            )
        )
        session.commit()
        raise SystemExit(f"error: crawl {slug} failed: {exc}") from exc

    result = ingest(parsed)
    inserted = 0
    for article in result.articles:
        exists = session.scalar(
            select(Article.id).where(Article.canonical_url == article["canonical_url"])
        )
        if exists is not None:
            continue
        published = article.get("published_at")
        session.add(
            Article(
                source_id=source.id,
                external_id=str(article.get("external_id", "")),
                canonical_url=str(article["canonical_url"]),
                title=str(article.get("title", "")),
                summary=None,
                body_text=str(article.get("body_text", "")),
                language=str(article.get("language", "th")),
                category=str(article.get("category", "")),
                agency_name=str(article.get("agency_name", "")),
                published_at=published if isinstance(published, datetime) else None,
                published_raw=str(article.get("published_raw", "")),
                first_seen_at=_utcnow(),
                last_seen_at=_utcnow(),
                content_hash=str(
                    article.get("content_hash")
                    or content_hash(
                        str(article.get("title", "")),
                        str(article.get("body_text", "")),
                    )
                ),
            )
        )
        inserted += 1

    source.last_success_at = _utcnow()
    source.last_error = None
    session.add(
        CollectorRun(
            source_id=source.id,
            started_at=started,
            finished_at=_utcnow(),
            status="ok",
            found_count=result.stats.found,
            inserted_count=inserted,
            skipped_count=result.stats.found - inserted,
        )
    )
    session.commit()
    return CrawlResult(
        source=slug,
        found=result.stats.found,
        inserted=inserted,
        skipped=result.stats.found - inserted,
    )
