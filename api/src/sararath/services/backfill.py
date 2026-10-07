"""Re-fetch article bodies for a source after a parser change."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

import httpx
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from sararath.collectors.base import DiscoveredItem
from sararath.collectors.http import USER_AGENT
from sararath.collectors.http import fetch as http_fetch
from sararath.collectors.moac import parse_article as parse_moac_article
from sararath.collectors.prd import PrdCollector
from sararath.collectors.thaigov import ThaigovCollector
from sararath.models import Article, Attachment, Source
from sararath.services.dedupe import content_hash

# Markers left behind when inline script/style text leaked into body_text.
DIRTY_MARKERS = ("%function(%", "%jQuery(%", "%$(")

# Enriched moac articles carry a large (`/data/news/l/`) image; the RSS
# description only has the small thumbnail, so this marks them as done.
MOAC_ENRICHED = "%/data/news/l/%"

SUPPORTED = {"prd", "moac", "thaigov"}


@dataclass
class BackfillResult:
    candidates: int
    updated: int
    failed: int


def _replace_attachments(
    session: Session, article: Article, urls: tuple[str, ...]
) -> None:
    for attachment in article.attachments:
        session.delete(attachment)
    for url in urls:
        session.add(Attachment(article_id=article.id, url=url))


async def _refresh_prd(session: Session, articles: list[Article]) -> tuple[int, int]:
    updated = failed = 0
    async with httpx.AsyncClient(follow_redirects=True) as client:
        collector = PrdCollector(client)
        for article in articles:
            try:
                raw = await collector.fetch(
                    DiscoveredItem(
                        external_id=article.external_id,
                        url=article.canonical_url,
                        published_raw=article.published_raw,
                    )
                )
                parsed = collector.parse(raw)
            except Exception:
                failed += 1
                continue
            if not parsed.body_text:
                failed += 1
                continue
            _replace_attachments(session, article, parsed.attachments)
            article.body_text = parsed.body_text
            article.content_hash = content_hash(article.title, parsed.body_text)
            updated += 1
    return updated, failed


async def _refresh_moac(session: Session, articles: list[Article]) -> tuple[int, int]:
    updated = failed = 0
    async with httpx.AsyncClient(follow_redirects=True) as client:
        for article in articles:
            try:
                response = await http_fetch(
                    client, article.canonical_url, {"User-Agent": USER_AGENT}
                )
                response.raise_for_status()
            except Exception:
                failed += 1
                continue
            body, images = parse_moac_article(response.text, str(response.url))
            if not body:
                failed += 1
                continue
            _replace_attachments(session, article, images)
            article.body_text = body
            article.content_hash = content_hash(article.title, body)
            updated += 1
    return updated, failed


async def _refresh_thaigov(
    session: Session, articles: list[Article]
) -> tuple[int, int]:
    updated = failed = 0
    async with httpx.AsyncClient(follow_redirects=True) as client:
        collector = ThaigovCollector(client)
        for article in articles:
            try:
                raw = await collector.fetch(
                    DiscoveredItem(
                        external_id=article.external_id,
                        url=article.canonical_url,
                        published_raw=article.published_raw,
                    )
                )
                parsed = collector.parse(raw)
            except Exception:
                failed += 1
                continue
            if not parsed.body_text:
                failed += 1
                continue
            _replace_attachments(session, article, parsed.attachments)
            article.body_text = parsed.body_text
            article.content_hash = content_hash(article.title, parsed.body_text)
            updated += 1
    return updated, failed


def _candidate_query(slug: str, reprocess: bool):
    if reprocess:
        return None
    if slug == "prd":
        return or_(*[Article.body_text.like(m) for m in DIRTY_MARKERS])
    if slug == "moac":
        return ~Article.attachments.any(Attachment.url.like(MOAC_ENRICHED))
    return None


def backfill_bodies(
    session: Session,
    slug: str,
    *,
    limit: int = 200,
    offset: int = 0,
    dry_run: bool = False,
    reprocess: bool = False,
) -> BackfillResult:
    if slug not in SUPPORTED:
        raise SystemExit(f"error: no body backfill for source {slug!r}")
    source = session.scalar(select(Source).where(Source.slug == slug))
    if source is None:
        raise SystemExit(f"error: unknown source {slug!r}")
    stmt = (
        select(Article)
        .where(Article.source_id == source.id)
        .order_by(Article.published_at.desc().nulls_last(), Article.id.desc())
        .offset(offset)
        .limit(limit)
    )
    condition = _candidate_query(slug, reprocess)
    if condition is not None:
        stmt = stmt.where(condition)
    articles = list(session.scalars(stmt).all())
    if dry_run:
        return BackfillResult(candidates=len(articles), updated=0, failed=0)
    if slug == "prd":
        updated, failed = asyncio.run(_refresh_prd(session, articles))
    elif slug == "moac":
        updated, failed = asyncio.run(_refresh_moac(session, articles))
    else:
        updated, failed = asyncio.run(_refresh_thaigov(session, articles))
    session.commit()
    return BackfillResult(candidates=len(articles), updated=updated, failed=failed)
