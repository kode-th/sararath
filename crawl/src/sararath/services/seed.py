"""Seed sources table from sources/sources.yaml. Idempotent by slug."""

from __future__ import annotations

from pathlib import Path
from typing import Any, cast

import yaml
from sqlalchemy import select
from sqlalchemy.orm import Session

from sararath.models import Source

DEFAULT_PATH = Path("sources/sources.yaml")


def load_sources(path: str | Path = DEFAULT_PATH) -> list[dict[str, Any]]:
    with open(path, encoding="utf-8") as f:
        data: dict[str, Any] | None = yaml.safe_load(f)
    if not isinstance(data, dict):
        return []
    raw_sources = data.get("sources", [])
    if not isinstance(raw_sources, list):
        return []
    return cast(
        "list[dict[str, Any]]",
        [s for s in raw_sources if isinstance(s, dict) and s.get("slug")],
    )


def seed_sources(session: Session, path: str | Path = DEFAULT_PATH) -> tuple[int, int]:
    inserted = 0
    updated = 0
    for raw in load_sources(path):
        slug = str(raw["slug"])
        existing = session.scalar(select(Source).where(Source.slug == slug))
        fields = {
            "name_th": str(raw.get("name_th", "")),
            "name_en": str(raw.get("name_en", "")),
            "agency_type": str(raw.get("agency_type", "")),
            "homepage_url": str(raw.get("homepage_url", "")),
            "feed_url": raw.get("feed_url"),
            "collector": str(raw.get("collector", "")),
            "category": str(raw.get("category", "")),
            "enabled": bool(raw.get("enabled", True)),
            "crawl_interval_minutes": int(raw.get("crawl_interval_minutes", 60)),
        }
        if existing is None:
            session.add(Source(slug=slug, **fields))
            inserted += 1
        else:
            for key, value in fields.items():
                setattr(existing, key, value)
            updated += 1
    session.commit()
    return inserted, updated
