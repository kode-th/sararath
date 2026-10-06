"""Response models for the read API (drive the OpenAPI schema)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class SourceRef(BaseModel):
    slug: str
    name_th: str


class ArticleOut(BaseModel):
    id: str
    source: SourceRef
    title: str
    summary: str | None
    body_text: str
    category: str
    agency_name: str
    canonical_url: str
    language: str
    published_at: datetime | None
    published_raw: str
    retrieved_at: datetime | None
    last_seen_at: datetime | None
    attachments: list[str]


class ArticlesPage(BaseModel):
    items: list[ArticleOut]
    next_cursor: str | None


class SuggestArticleOut(BaseModel):
    id: str
    title: str


class SuggestOut(BaseModel):
    sources: list[SourceRef]
    articles: list[SuggestArticleOut]


class RunOut(BaseModel):
    source: str
    started_at: datetime
    finished_at: datetime | None
    status: str
    http_status: int | None
    found_count: int
    inserted_count: int
    skipped_count: int
    error: str | None


class RunsPage(BaseModel):
    items: list[RunOut]


class SourceOut(BaseModel):
    slug: str
    name_th: str
    name_en: str
    collector: str
    enabled: bool
    last_success_at: datetime | None
    last_error: str | None


class SourcesPage(BaseModel):
    items: list[SourceOut]


class HealthSourceOut(BaseModel):
    slug: str
    last_success_at: datetime | None
    last_error: str | None


class HealthOut(BaseModel):
    db: str
    sources: list[HealthSourceOut]
