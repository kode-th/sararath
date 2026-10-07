"""Remove duplicate articles that share a source, title, and published_at."""

from __future__ import annotations

import re
from collections.abc import Iterator
from dataclasses import dataclass

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from sararath.collectors.html import strip_trailing_attribution
from sararath.models import Article, Attachment, Source
from sararath.services.dedupe import content_hash

CHUNK = 500

# Inline script text that leaked into stored bodies (e.g. prd). Everything from
# the first marker on is page chrome, not article content.
SCRIPT_MARKERS = (
    "jQuery(",
    "$(",
    "addEventListener(",
    "lightGallery(",
    "function(data)",
    "DialogWarning(",
)


@dataclass(frozen=True)
class StripResult:
    scanned: int
    cleaned: int


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


def _script_index(text: str) -> int:
    index = -1
    for marker in SCRIPT_MARKERS:
        found = text.find(marker)
        if found != -1 and (index == -1 or found < index):
            index = found
    return index


_LEADING_DATE = re.compile(r"^\s*\d{1,2}/\d{1,2}/\d{4}[\s|\d]*")


def _clean_body(title: str, text: str) -> str:
    body = text.strip()
    heading = " ".join((title or "").split())
    if heading and body.startswith(heading):
        body = body[len(heading) :].lstrip()
    body = _LEADING_DATE.sub("", body)
    body = strip_trailing_attribution(body)
    index = _script_index(body)
    if index > 0:
        body = body[:index].rstrip()
    return body.strip()


def strip_script_text(
    session: Session, source: str | None = None, dry_run: bool = False
) -> StripResult:
    stmt = select(Article.id, Article.title, Article.body_text).join(
        Source, Article.source_id == Source.id
    )
    if source is not None:
        stmt = stmt.where(Source.slug == source)
    scanned = cleaned = 0
    for article_id, title, body in session.execute(stmt):
        scanned += 1
        text = body or ""
        cleaned_body = _clean_body(title or "", text)
        if not cleaned_body or cleaned_body == text.strip():
            continue
        cleaned += 1
        if not dry_run:
            session.execute(
                update(Article)
                .where(Article.id == article_id)
                .values(
                    body_text=cleaned_body,
                    content_hash=content_hash(title, cleaned_body),
                )
            )
    if not dry_run and cleaned:
        session.commit()
    return StripResult(scanned=scanned, cleaned=cleaned)
