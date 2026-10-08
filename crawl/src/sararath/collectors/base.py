"""Collector data types: discovered items, raw fetches, parsed articles."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class DiscoveredItem:
    external_id: str
    url: str
    published_raw: str | None = None


@dataclass(frozen=True)
class RawArticle:
    url: str
    status: int
    html: str
    retrieved_at: datetime
    final_url: str


@dataclass(frozen=True)
class ParsedArticle:
    external_id: str
    canonical_url: str
    title: str
    summary: str
    body_text: str
    language: str
    category: str
    agency_name: str
    published_at: datetime | None
    published_raw: str
    attachments: tuple[str, ...] = ()
