"""Drop image attachments that do not actually resolve to an image.

Government sites sometimes publish article images behind hotlink protection or
serve an HTML error page at the image URL. Those URLs render as a broken box in
the UI, so validate them before storing and prune the ones already stored.
"""

from __future__ import annotations

import asyncio
from collections.abc import Iterable
from dataclasses import dataclass, replace

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from sararath.collectors.base import ParsedArticle
from sararath.collectors.http import USER_AGENT, RateLimiter, open_stream
from sararath.models import Article, Attachment, Source

TIMEOUT = 8.0
CONCURRENCY = 8

# Images are cheap probes; keep a lighter pace than page fetches.
limiter = RateLimiter(min_interval=0.25)


async def _is_image(client: httpx.AsyncClient, url: str) -> bool:
    await limiter.wait(url)
    try:
        async with asyncio.timeout(TIMEOUT):
            response = await open_stream(
                client,
                url,
                {"User-Agent": USER_AGENT, "Range": "bytes=0-1"},
            )
            try:
                content_type = response.headers.get("content-type", "")
                is_image = response.status_code in (
                    200,
                    206,
                ) and content_type.lower().startswith("image/")
                if is_image:
                    # Read one chunk so the cancellation scope has a checkpoint.
                    async for _chunk in response.aiter_bytes():
                        break
                return is_image
            finally:
                await response.aclose()
    except Exception:
        return False


async def resolve_images(urls: Iterable[str]) -> set[str]:
    """Return the subset of ``urls`` whose response is an image."""
    unique = list(dict.fromkeys(urls))
    if not unique:
        return set()
    semaphore = asyncio.Semaphore(CONCURRENCY)

    async with httpx.AsyncClient() as client:

        async def check(url: str) -> str | None:
            async with semaphore:
                return url if await _is_image(client, url) else None

        results = await asyncio.gather(*(check(url) for url in unique))
    return {url for url in results if url is not None}


async def filter_broken_attachments(
    articles: list[ParsedArticle],
) -> list[ParsedArticle]:
    valid = await resolve_images([url for a in articles for url in a.attachments])
    return [
        replace(a, attachments=tuple(u for u in a.attachments if u in valid))
        if a.attachments
        else a
        for a in articles
    ]


@dataclass(frozen=True)
class PruneResult:
    scanned: int
    removed: int


def prune_attachments(
    session: Session, source: str | None = None, *, dry_run: bool = False
) -> PruneResult:
    stmt = select(Attachment)
    if source is not None:
        stmt = stmt.join(Article).join(Source).where(Source.slug == source)
    attachments = list(session.scalars(stmt).all())
    if not attachments:
        return PruneResult(scanned=0, removed=0)
    valid = asyncio.run(resolve_images([a.url for a in attachments]))
    removed = [a for a in attachments if a.url not in valid]
    if not dry_run:
        for attachment in removed:
            session.delete(attachment)
        session.commit()
    return PruneResult(scanned=len(attachments), removed=len(removed))
