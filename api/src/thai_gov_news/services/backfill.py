"""Re-fetch article bodies for a source after a parser change."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

import httpx
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from thai_gov_news.collectors.base import DiscoveredItem
from thai_gov_news.collectors.http import USER_AGENT
from thai_gov_news.collectors.http import fetch as http_fetch
from thai_gov_news.collectors.moac import parse_article as parse_moac_article
from thai_gov_news.collectors.prd import PrdCollector
from thai_gov_news.models import Article, Attachment, Source
from thai_gov_news.services.dedupe import content_hash

# Markers left behind when inline script/style text leaked into body_text.
DIRTY_MARKERS = ("%function(%", "%jQuery(%", "%$(")

# Enriched moac articles carry a large (`/data/news/l/`) image; the RSS
# description only has the small thumbnail, so this marks them as done.
MOAC_ENRICHED = "%/data/news/l/%"

SUPPORTED = {"prd", "moac"}


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
            for attachment in article.attachments:
                session.delete(attachment)
            for image in images:
                session.add(Attachment(article_id=article.id, url=image))
            article.body_text = body
            article.content_hash = content_hash(article.title, body)
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
    base = (
        select(Article)
        .where(Article.source_id == source.id)
        .order_by(Article.published_at.desc().nulls_last(), Article.id.desc())
        .limit(limit)
    )
    if slug == "prd":
        stmt = base.where(or_(*[Article.body_text.like(m) for m in DIRTY_MARKERS]))
        articles = list(session.scalars(stmt).all())
        if dry_run:
            return BackfillResult(candidates=len(articles), updated=0, failed=0)
        updated, failed = asyncio.run(_refresh_prd(articles))
    else:
        stmt = base.where(~Article.attachments.any(Attachment.url.like(MOAC_ENRICHED)))
        articles = list(session.scalars(stmt).all())
        if dry_run:
            return BackfillResult(candidates=len(articles), updated=0, failed=0)
        updated, failed = asyncio.run(_refresh_moac(session, articles))
    session.commit()
    return BackfillResult(candidates=len(articles), updated=updated, failed=failed)
