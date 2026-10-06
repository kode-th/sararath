"""Remove duplicate articles that share a source, title, and published_at."""

from __future__ import annotations

from collections.abc import Iterator
from dataclasses import dataclass

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from thai_gov_news.models import Article, Attachment, Source

CHUNK = 500


@dataclass(frozen=True)
class CleanupResult:
    groups: int
    removed: int


def _story_key(source_id: object, title: str, published_at: object) -> tuple:
    return (source_id, " ".join(title.split()).casefold(), published_at)


def _chunks(items: list, size: int) -> Iterator[list]:
    for start in range(0, len(items), size):
        yield items[start : start + size]


def dedupe_articles(
    session: Session, source: str | None = None, dry_run: bool = False
) -> CleanupResult:
    stmt = select(
        Article.id,
        Article.source_id,
        Article.title,
        Article.published_at,
        func.length(Article.body_text),
        Article.first_seen_at,
    )
    if source is not None:
        source_id = session.scalar(select(Source.id).where(Source.slug == source))
        stmt = stmt.where(Article.source_id == source_id)

    groups: dict[tuple, list] = {}
    for row in session.execute(stmt):
        groups.setdefault(_story_key(row[1], row[2], row[3]), []).append(row)

    duplicates = [group for group in groups.values() if len(group) > 1]
    doomed: list = []
    for group in duplicates:
        # richest body wins; then earliest sighting; then id for determinism
        keep = min(group, key=lambda r: (-(r[4] or 0), r[5], str(r[0])))
        keep_id = keep[0]
        doomed.extend(r[0] for r in group if r[0] != keep_id)

    if not dry_run and doomed:
        for chunk in _chunks(doomed, CHUNK):
            session.execute(delete(Attachment).where(Attachment.article_id.in_(chunk)))
            session.execute(delete(Article).where(Article.id.in_(chunk)))
        session.commit()

    return CleanupResult(groups=len(duplicates), removed=len(doomed))
