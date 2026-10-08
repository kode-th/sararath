"""Crawl runner: collect -> ingest -> store. One source per run."""

from __future__ import annotations

import asyncio
import hashlib
import uuid
from dataclasses import dataclass, replace
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from sararath.collectors.base import ParsedArticle
from sararath.collectors.http import ROBOTS_OVERRIDES
from sararath.collectors.http import USER_AGENT
from sararath.collectors.http import fetch as http_fetch
from sararath.collectors.moac import parse_article
from sararath.collectors.prd import PrdCollector
from sararath.collectors.rss import FeedConfig, RssCollector, parse_feed
from sararath.collectors.thaigov import ThaigovCollector
from sararath.models import Article, Attachment, CollectorRun, Source
from sararath.domain.dedupe import content_hash
from sararath.domain.images import filter_broken_attachments
from sararath.pipeline.ingest import ingest
from sararath.domain.links import normalizer_for
from sararath.domain.normalize import normalize_url


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

# Sources whose feed lacks the article body; fetch the page for recent items.
RECENT_ENRICH = {"moac"}
RECENT_WINDOW = timedelta(days=14)


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
        link_normalizer=normalizer_for(source.slug),
    )
    collector = RssCollector(config)
    raw = await collector.fetch_raw()
    articles = parse_feed(raw.html, config)
    if source.slug in RECENT_ENRICH:
        articles = await _enrich_recent(articles)
    return [(a, None, EXT_HTML) for a in articles]


async def _enrich_recent(articles: list[ParsedArticle]) -> list[ParsedArticle]:
    """Fill in body + gallery for recently published feed items (new articles)."""
    cutoff = _naive_utc(_utcnow() - RECENT_WINDOW)
    enriched = list(articles)
    async with httpx.AsyncClient() as client:
        for index, article in enumerate(articles):
            published = _naive_utc(article.published_at)
            if cutoff is None or published is None or published < cutoff:
                continue
            try:
                response = await http_fetch(
                    client, article.canonical_url, {"User-Agent": USER_AGENT}
                )
                response.raise_for_status()
            except Exception:
                continue
            body, images = parse_article(response.text, str(response.url))
            if body:
                enriched[index] = replace(article, body_text=body, attachments=images)
    return enriched


async def _collect(source: Source) -> list[tuple[ParsedArticle, str | None, str]]:
    if source.collector == "thaigov":
        return await _collect_thaigov()
    if source.collector == "prd":
        return await _collect_prd()
    if source.collector == "rss":
        return await _collect_rss(source)
    raise SystemExit(f"error: collector {source.collector!r} not implemented")


async def _collect_and_filter(
    source: Source,
) -> list[tuple[ParsedArticle, str | None, str]]:
    collected = await _collect(source)
    articles = await filter_broken_attachments([parsed for parsed, _, _ in collected])
    return [(article, raw, ext) for article, (_, raw, ext) in zip(articles, collected)]


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


def _naive_utc(value: datetime | None) -> datetime | None:
    if isinstance(value, datetime) and value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def _story_key(
    title: str, published_at: datetime | None
) -> tuple[str, datetime | None]:
    return (" ".join(title.split()).casefold(), _naive_utc(published_at))


def _collapse_stories(articles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Keep one article per (title, published_at), preferring the richest body.

    Feeds like moac list the same item under several URLs; the longer body is the
    fuller copy, so drop the stubs before storing.
    """
    by_story: dict[tuple[str, datetime | None], dict[str, Any]] = {}
    for article in articles:
        published = article.get("published_at")
        key = _story_key(
            str(article.get("title", "")),
            published if isinstance(published, datetime) else None,
        )
        current = by_story.get(key)
        if current is None or len(str(article.get("body_text", ""))) > len(
            str(current.get("body_text", ""))
        ):
            by_story[key] = article
    return list(by_story.values())


def _article_key(article: dict[str, Any]) -> tuple[str, datetime | None]:
    published = article.get("published_at")
    return _story_key(
        str(article.get("title", "")),
        published if isinstance(published, datetime) else None,
    )


def _attachment_urls(article: dict[str, Any]) -> tuple[str, ...]:
    return tuple(str(url) for url in article.get("attachments") or ())


def _touch_known(
    session: Session, known: Article, article: dict[str, Any], now: datetime
) -> None:
    known.last_seen_at = now
    # A corrected feed URL (e.g. moac's chained links) should replace the stored one.
    url = str(article["canonical_url"])
    if url != known.canonical_url:
        known.canonical_url = url
    # Backfill a missing publish date (older rows stored before the feed had one).
    published = article.get("published_at")
    if known.published_at is None and isinstance(published, datetime):
        known.published_at = published
        known.published_raw = str(article.get("published_raw") or known.published_raw)
    body = str(article.get("body_text", ""))
    if len(body) > len(known.body_text or ""):
        known.body_text = body
        known.content_hash = str(article.get("content_hash") or known.content_hash)
    if known.attachments:
        return
    for url in _attachment_urls(article):
        session.add(Attachment(article_id=known.id, url=url))


def _insert_fresh(
    session: Session,
    source: Source,
    slug: str,
    day: str,
    raws: dict[str, tuple[str | None, str]],
    fresh: list[dict[str, Any]],
) -> int:
    built = [(_build_article(source.id, slug, day, raws, a), a) for a in fresh]
    for db_article, _ in built:
        session.add(db_article)
    session.flush()
    for db_article, article in built:
        for url in _attachment_urls(article):
            session.add(Attachment(article_id=db_article.id, url=url))
    return len(built)


def _store_articles(
    session: Session,
    source: Source,
    slug: str,
    day: str,
    raws: dict[str, tuple[str | None, str]],
    articles: list[dict[str, Any]],
) -> int:
    articles = _collapse_stories(articles)
    rows = session.scalars(
        select(Article)
        .options(selectinload(Article.attachments))
        .where(Article.source_id == source.id)
    ).all()
    by_url = {a.canonical_url: a for a in rows}
    by_story = {_story_key(a.title, a.published_at): a for a in rows}
    now = _utcnow()
    fresh: list[dict[str, Any]] = []
    for article in articles:
        known = by_story.get(_article_key(article)) or by_url.get(
            str(article["canonical_url"])
        )
        if known is None:
            fresh.append(article)
        else:
            _touch_known(session, known, article, now)
    return _insert_fresh(session, source, slug, day, raws, fresh)


def run_crawl(session: Session, slug: str) -> CrawlResult:
    source = session.scalar(select(Source).where(Source.slug == slug))
    if source is None:
        raise SystemExit(f"error: unknown source {slug!r}, run seed first")
    source.last_attempt_at = _utcnow()
    source.robots_ok = slug not in ROBOTS_OVERRIDES
    session.commit()

    started = _utcnow()
    try:
        collected = asyncio.run(_collect_and_filter(source))
    except SystemExit:
        raise
    except Exception as exc:
        detail = f"{type(exc).__name__}: {exc}"
        source.last_error = detail[:1000]
        session.add(
            CollectorRun(
                source_id=source.id,
                started_at=started,
                finished_at=_utcnow(),
                status="error",
                error=detail[:1000],
            )
        )
        session.commit()
        raise SystemExit(f"error: crawl {slug} failed: {detail}") from exc

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
