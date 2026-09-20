"""Crawl runner: collect -> ingest -> store. One source per run."""

from __future__ import annotations

import asyncio
import hashlib
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from thai_gov_news.collectors.base import ParsedArticle
from thai_gov_news.collectors.prd import PrdCollector
from thai_gov_news.collectors.rss import FeedConfig, RssCollector, parse_feed
from thai_gov_news.collectors.thaigov import ThaigovCollector
from thai_gov_news.models import Article, Attachment, CollectorRun, Source
from thai_gov_news.services.dedupe import content_hash
from thai_gov_news.services.ingest import ingest
from thai_gov_news.services.normalize import normalize_url


@dataclass(frozen=True)
class CrawlResult:
    source: str
    found: int
    inserted: int
    skipped: int


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


EXT_HTML = ".html"
EXT_JSON = ".json"


def raw_path_for(slug: str, url: str, day: str, ext: str) -> Path:
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
    return Path("raw") / slug / day / f"{digest}{ext}"


async def _collect_prd() -> list[tuple[ParsedArticle, str | None, str]]:
    collector = PrdCollector()
    out: list[tuple[ParsedArticle, str | None, str]] = []
    for item in await collector.discover():
        raw = await collector.fetch(item)
        if raw.status != 200:
            continue
        out.append((collector.parse(raw), raw.html, EXT_HTML))
    return out


async def _collect_thaigov() -> list[tuple[ParsedArticle, str | None, str]]:
    collector = ThaigovCollector()
    out: list[tuple[ParsedArticle, str | None, str]] = []
    for item in await collector.discover():
        raw = await collector.fetch(item)
        if raw.status != 200:
            continue
        out.append((collector.parse(raw), raw.html, EXT_JSON))
    return out


async def _collect_rss(source: Source) -> list[tuple[ParsedArticle, str | None, str]]:
    config = FeedConfig(
        slug=source.slug,
        feed_url=str(source.feed_url or ""),
        agency_name=source.name_th,
        category=source.category,
    )
    collector = RssCollector(config)
    raw = await collector.fetch_raw()
    return [(a, None, EXT_HTML) for a in parse_feed(raw.html, config)]


async def _collect(source: Source) -> list[tuple[ParsedArticle, str | None, str]]:
    if source.collector == "thaigov":
        return await _collect_thaigov()
    if source.collector == "prd":
        return await _collect_prd()
    if source.collector == "rss":
        return await _collect_rss(source)
    raise SystemExit(f"error: collector {source.collector!r} not implemented")


def _save_raw(slug: str, url: str, day: str, ext: str, raw: str) -> str:
    path = raw_path_for(slug, url, day, ext)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(raw, encoding="utf-8")
    return str(path)


def _build_article(
    source_id: uuid.UUID,
    slug: str,
    day: str,
    raws: dict[str, tuple[str | None, str]],
    article: dict[str, Any],
) -> Article:
    published = article.get("published_at")
    summary = article.get("summary")
    raw, ext = raws.get(str(article["canonical_url"]), (None, EXT_HTML))
    raw_path = (
        _save_raw(slug, str(article["canonical_url"]), day, ext, raw) if raw else None
    )
    return Article(
        source_id=source_id,
        external_id=str(article.get("external_id", "")),
        canonical_url=str(article["canonical_url"]),
        title=str(article.get("title", "")),
        summary=str(summary) if summary else None,
        body_text=str(article.get("body_text", "")),
        language=str(article.get("language", "th")),
        category=str(article.get("category", "")),
        agency_name=str(article.get("agency_name", "")),
        published_at=published if isinstance(published, datetime) else None,
        published_raw=str(article.get("published_raw", "")),
        first_seen_at=_utcnow(),
        last_seen_at=_utcnow(),
        raw_path=raw_path,
        content_hash=str(
            article.get("content_hash")
            or content_hash(
                str(article.get("title", "")),
                str(article.get("body_text", "")),
            )
        ),
    )


def _store_articles(
    session: Session,
    source: Source,
    slug: str,
    day: str,
    raws: dict[str, tuple[str | None, str]],
    articles: list[dict[str, Any]],
) -> int:
    urls = [str(a["canonical_url"]) for a in articles]
    seen: dict[str, Article] = {}
    if urls:
        rows = session.scalars(
            select(Article).where(Article.canonical_url.in_(urls))
        ).all()
        seen = {a.canonical_url: a for a in rows}
    now = _utcnow()
    for known in seen.values():
        known.last_seen_at = now
    fresh = [a for a in articles if str(a["canonical_url"]) not in seen]
    built = [(_build_article(source.id, slug, day, raws, a), a) for a in fresh]
    for db_article, _ in built:
        session.add(db_article)
    session.flush()
    for db_article, article in built:
        for attachment_url in article.get("attachments") or []:
            session.add(Attachment(article_id=db_article.id, url=str(attachment_url)))
    return len(built)


def run_crawl(session: Session, slug: str) -> CrawlResult:
    source = session.scalar(select(Source).where(Source.slug == slug))
    if source is None:
        raise SystemExit(f"error: unknown source {slug!r}, run seed first")
    source.last_attempt_at = _utcnow()
    session.commit()

    started = _utcnow()
    try:
        collected = asyncio.run(_collect(source))
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

    day = started.date().isoformat()
    raws = {normalize_url(p.canonical_url): (raw, ext) for p, raw, ext in collected}
    result = ingest([p for p, _, _ in collected])
    inserted = _store_articles(session, source, slug, day, raws, result.articles)

    source.last_success_at = _utcnow()
    source.last_error = None
    session.add(
        CollectorRun(
            source_id=source.id,
            started_at=started,
            finished_at=_utcnow(),
            status="ok",
            http_status=200,
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
