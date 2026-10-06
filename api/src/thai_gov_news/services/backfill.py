"""Re-fetch article bodies for a source after a parser change."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

import httpx
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from thai_gov_news.collectors.base import DiscoveredItem
from thai_gov_news.collectors.prd import PrdCollector
from thai_gov_news.models import Article, Source
from thai_gov_news.services.dedupe import content_hash

# Markers left behind when inline script/style text leaked into body_text.
DIRTY_MARKERS = ("%function(%", "%jQuery(%", "%$(")

SUPPORTED = {"prd"}


@dataclass
class BackfillResult:
    candidates: int
    updated: int
    failed: int


async def _refresh_prd(articles: list[Article]) -> tuple[int, int]:
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
            article.body_text = parsed.body_text
            article.content_hash = content_hash(article.title, parsed.body_text)
            updated += 1
    return updated, failed


def backfill_bodies(
    session: Session, slug: str, *, limit: int = 200, dry_run: bool = False
) -> BackfillResult:
    if slug not in SUPPORTED:
        raise SystemExit(f"error: no body backfill for source {slug!r}")
    source = session.scalar(select(Source).where(Source.slug == slug))
    if source is None:
        raise SystemExit(f"error: unknown source {slug!r}")
    stmt = (
        select(Article)
        .where(Article.source_id == source.id)
        .where(or_(*[Article.body_text.like(marker) for marker in DIRTY_MARKERS]))
        .order_by(Article.published_at.desc().nulls_last(), Article.id.desc())
        .limit(limit)
    )
    articles = list(session.scalars(stmt).all())
    if dry_run:
        return BackfillResult(candidates=len(articles), updated=0, failed=0)
    updated, failed = asyncio.run(_refresh_prd(articles))
    session.commit()
    return BackfillResult(candidates=len(articles), updated=updated, failed=failed)
