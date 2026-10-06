"""Per-source canonical URL fixes."""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from thai_gov_news.models import Article, Source

# moac's canonical article path; every feed id maps back to this shape.
_MOAC_CLEAN = "https://www.moac.go.th/news-preview-{}"


def moac_article_url(url: str) -> str:
    """Collapse moac's malformed feed links to the real article URL.

    moac sometimes emits chained links (`…-preview-<id>-preview-<id>…`, often
    prefixed `jakarta-news`/`beijing-news`); those 403 or render an empty shell.
    The article is the last `preview-<id>` under the `news-preview-<id>` path.
    """
    if "moac.go.th" not in url or "preview-" not in url or "dwl-" in url:
        return url
    ids = re.findall(r"preview-(\d+)", url)
    return _MOAC_CLEAN.format(ids[-1]) if ids else url


_NORMALIZERS: dict[str, Callable[[str], str]] = {"moac": moac_article_url}


def normalizer_for(slug: str) -> Callable[[str], str] | None:
    return _NORMALIZERS.get(slug)


@dataclass(frozen=True)
class RepairResult:
    checked: int
    updated: int


def repair_links(
    session: Session, source: str | None = None, dry_run: bool = False
) -> RepairResult:
    stmt = select(Article, Source.slug).join(Source, Article.source_id == Source.id)
    if source is not None:
        stmt = stmt.where(Source.slug == source)
    taken = set(session.scalars(select(Article.canonical_url)).all())
    checked = updated = 0
    for article, slug in session.execute(stmt):
        normalizer = normalizer_for(slug)
        if normalizer is None:
            continue
        checked += 1
        new_url = normalizer(article.canonical_url)
        if new_url == article.canonical_url or new_url in taken:
            continue
        updated += 1
        taken.discard(article.canonical_url)
        taken.add(new_url)
        if not dry_run:
            article.canonical_url = new_url
    if not dry_run and updated:
        session.commit()
    return RepairResult(checked=checked, updated=updated)
