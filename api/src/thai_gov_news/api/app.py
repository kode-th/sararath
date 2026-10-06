"""Read API: articles, sources, health."""

from __future__ import annotations

import os
import uuid
from collections.abc import Iterator
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from scalar_fastapi import get_scalar_api_reference
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from thai_gov_news.api.schemas import (
    ArticleOut,
    ArticlesPage,
    HealthOut,
    RunsPage,
    SourcesPage,
    SuggestOut,
)
from thai_gov_news.database import get_session
from thai_gov_news.models import Article, Attachment, CollectorRun, Source

app = FastAPI(title="thai-gov-news")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/reference", include_in_schema=False)
def reference():  # type: ignore[no-untyped-def]
    return get_scalar_api_reference(openapi_url="/openapi.json", title="thai-gov-news")


def get_db() -> Iterator[Session]:
    session = get_session()
    try:
        yield session
    finally:
        session.close()


def article_out(
    article: Article, slug: str, name_th: str, attachments: list[str] | None = None
) -> dict:
    return {
        "id": str(article.id),
        "source": {"slug": slug, "name_th": name_th},
        "title": article.title,
        "summary": article.summary,
        "body_text": article.body_text,
        "category": article.category,
        "agency_name": article.agency_name,
        "canonical_url": article.canonical_url,
        "language": article.language,
        "published_at": article.published_at,
        "published_raw": article.published_raw,
        "retrieved_at": article.first_seen_at,
        "last_seen_at": article.last_seen_at,
        "attachments": attachments or [],
    }


def attachment_map(session: Session, ids: list) -> dict:
    if not ids:
        return {}
    rows = session.execute(
        select(Attachment.article_id, Attachment.url).where(
            Attachment.article_id.in_(ids)
        )
    ).all()
    grouped: dict = {}
    for article_id, url in rows:
        grouped.setdefault(str(article_id), []).append(url)
    return grouped


def _parse_date(value: str | None, name: str) -> str:
    if value is None:
        return ""
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(422, f"bad {name}, want YYYY-MM-DD") from None
    return value


def _cursor_row(session: Session, cursor: str | None) -> Article | None:
    if cursor is None:
        return None
    try:
        cid = uuid.UUID(cursor)
    except ValueError:
        raise HTTPException(422, "bad cursor") from None
    row = session.scalar(select(Article).where(Article.id == cid))
    if row is None:
        raise HTTPException(404, "cursor not found")
    return row


@app.get(
    "/v1/articles",
    response_model=ArticlesPage,
    responses={
        422: {"description": "Bad limit, date, or cursor"},
        404: {"description": "Cursor not found"},
    },
)
def list_articles(
    source: str | None = None,
    agency: str | None = None,
    category: str | None = None,
    published_from: str | None = None,
    published_to: str | None = None,
    q: str | None = None,
    limit: int = 20,
    cursor: str | None = None,
    session: Session = Depends(get_db),
) -> dict:
    if not 1 <= limit <= 100:
        raise HTTPException(422, "limit must be 1..100")
    date_from = _parse_date(published_from, "published_from")
    date_to = _parse_date(published_to, "published_to")
    stmt = (
        select(Article, Source.slug, Source.name_th)
        .join(Source, Article.source_id == Source.id)
        .order_by(Article.published_at.desc().nulls_last(), Article.id.desc())
    )
    if source:
        stmt = stmt.where(Source.slug == source)
    if agency:
        stmt = stmt.where(Article.agency_name.contains(agency))
    if category:
        stmt = stmt.where(Article.category == category)
    if date_from:
        stmt = stmt.where(func.date(Article.published_at) >= date_from)
    if date_to:
        stmt = stmt.where(func.date(Article.published_at) <= date_to)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                Article.title.like(like),
                Article.body_text.like(like),
                Article.agency_name.like(like),
            )
        )
    marker = _cursor_row(session, cursor)
    if marker is not None:
        if marker.published_at is None:
            stmt = stmt.where(Article.published_at.is_(None)).where(
                Article.id < marker.id
            )
        else:
            stmt = stmt.where(
                or_(
                    Article.published_at < marker.published_at,
                    Article.published_at.is_(None),
                    (Article.published_at == marker.published_at)
                    & (Article.id < marker.id),
                )
            )
    rows = session.execute(stmt.limit(limit + 1)).all()
    page = rows[:limit]
    next_cursor = str(page[-1][0].id) if len(rows) > limit else None
    attached = attachment_map(session, [a.id for a, _, _ in page])
    return {
        "items": [article_out(a, s, n, attached.get(str(a.id))) for a, s, n in page],
        "next_cursor": next_cursor,
    }


@app.get(
    "/v1/articles/{article_id}",
    response_model=ArticleOut,
    responses={
        422: {"description": "Bad article id"},
        404: {"description": "Article not found"},
    },
)
def get_article(article_id: str, session: Session = Depends(get_db)) -> dict:
    try:
        aid = uuid.UUID(article_id)
    except ValueError:
        raise HTTPException(422, "bad article id") from None
    row = session.execute(
        select(Article, Source.slug, Source.name_th)
        .join(Source, Article.source_id == Source.id)
        .where(Article.id == aid)
    ).one_or_none()
    if row is None:
        raise HTTPException(404, "article not found")
    article, slug, name_th = row
    attached = attachment_map(session, [article.id])
    return article_out(article, slug, name_th, attached.get(str(article.id)))


@app.get(
    "/v1/suggest",
    response_model=SuggestOut,
    responses={422: {"description": "Bad limit"}},
)
def suggest(
    q: str = "",
    limit: int = 6,
    session: Session = Depends(get_db),
) -> dict:
    if not 1 <= limit <= 20:
        raise HTTPException(422, "limit must be 1..20")
    term = q.strip()
    if not term:
        return {"sources": [], "articles": []}
    like = f"%{term}%"
    sources = session.scalars(
        select(Source).where(Source.name_th.like(like)).order_by(Source.slug).limit(4)
    ).all()
    rows = session.execute(
        select(Article.id, Article.title)
        .where(Article.title.like(like))
        .order_by(Article.published_at.desc().nulls_last(), Article.id.desc())
        .limit(limit * 4)
    ).all()
    seen: set[str] = set()
    articles: list[dict] = []
    for article_id, title in rows:
        key = " ".join(title.split()).casefold()
        if key in seen:
            continue
        seen.add(key)
        articles.append({"id": str(article_id), "title": title})
        if len(articles) >= limit:
            break
    return {
        "sources": [{"slug": s.slug, "name_th": s.name_th} for s in sources],
        "articles": articles,
    }


@app.get(
    "/v1/runs", response_model=RunsPage, responses={422: {"description": "Bad limit"}}
)
def list_runs(
    source: str | None = None,
    limit: int = 20,
    session: Session = Depends(get_db),
) -> dict:
    if not 1 <= limit <= 100:
        raise HTTPException(422, "limit must be 1..100")
    stmt = (
        select(CollectorRun, Source.slug)
        .join(Source, CollectorRun.source_id == Source.id)
        .order_by(CollectorRun.started_at.desc())
    )
    if source:
        stmt = stmt.where(Source.slug == source)
    rows = session.execute(stmt.limit(limit)).all()
    return {
        "items": [
            {
                "source": slug,
                "started_at": run.started_at,
                "finished_at": run.finished_at,
                "status": run.status,
                "http_status": run.http_status,
                "found_count": run.found_count,
                "inserted_count": run.inserted_count,
                "skipped_count": run.skipped_count,
                "error": run.error,
            }
            for run, slug in rows
        ]
    }


@app.get("/v1/sources", response_model=SourcesPage)
def list_sources(session: Session = Depends(get_db)) -> dict:
    rows = session.scalars(select(Source).order_by(Source.slug)).all()
    return {
        "items": [
            {
                "slug": s.slug,
                "name_th": s.name_th,
                "name_en": s.name_en,
                "collector": s.collector,
                "enabled": s.enabled,
                "last_success_at": s.last_success_at,
                "last_error": s.last_error,
            }
            for s in rows
        ]
    }


@app.get(
    "/v1/health",
    response_model=HealthOut,
    responses={503: {"description": "Database unreachable"}},
)
def health(session: Session = Depends(get_db)) -> dict:
    try:
        session.execute(select(1)).scalar()
    except Exception:
        raise HTTPException(503, "db unreachable") from None
    rows = session.scalars(select(Source).order_by(Source.slug)).all()
    return {
        "db": "ok",
        "sources": [
            {
                "slug": s.slug,
                "last_success_at": s.last_success_at,
                "last_error": s.last_error,
            }
            for s in rows
        ],
    }
