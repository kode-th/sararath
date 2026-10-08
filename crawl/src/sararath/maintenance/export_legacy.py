"""Legacy export: DB rows -> static daily JSON feed."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from sararath.clock import utcnow
from sararath.models import Article, Source

BANGKOK = ZoneInfo("Asia/Bangkok")
PIPELINE = "sararath-export-legacy-1.0"


def is_direct(url: str) -> bool:
    host = (urlparse(url or "").hostname or "").lower()
    return host.endswith(".go.th")


def post_from_article(article: Article, source_slug: str) -> dict:
    url = article.canonical_url or ""
    published = article.published_at
    if isinstance(published, datetime):
        published_str = published.date().isoformat()
    else:
        published_str = article.published_raw or ""
    return {
        "id": f"{source_slug}-{article.external_id}",
        "slug": article.external_id,
        "title": article.title,
        "topic": article.category or "",
        "agency": article.agency_name or "",
        "origin": "direct" if is_direct(url) else "indirect",
        "priority": "B",
        "urgency": "medium",
        "content": article.body_text or "",
        "source_url": url,
        "bd_opportunity": "",
        "tags": [],
        "category_label": article.category or "",
        "published_at": published_str,
    }


def _bangkok_date(published: datetime | None) -> str | None:
    if not isinstance(published, datetime):
        return None
    at = published if published.tzinfo else published.replace(tzinfo=timezone.utc)
    return at.astimezone(BANGKOK).date().isoformat()


def export_date(session: Session, date: str) -> dict:
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise SystemExit(f"error: bad date {date!r}, want YYYY-MM-DD") from None
    rows = session.execute(
        select(Article, Source.slug)
        .join(Source, Article.source_id == Source.id)
        .order_by(Article.published_at.desc())
    ).all()
    posts = [
        post_from_article(article, slug)
        for article, slug in rows
        if _bangkok_date(article.published_at) == date
    ]
    return {
        "date": date,
        "generated_at": utcnow().isoformat(),
        "pipeline": PIPELINE,
        "posts": posts,
        "stats": {
            "total": len(posts),
            "direct": sum(1 for p in posts if p["origin"] == "direct"),
            "indirect": sum(1 for p in posts if p["origin"] != "direct"),
        },
    }


def write_export(payload: dict, out: str | Path) -> Path:
    path = Path(out)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return path


def update_manifest(manifest: str | Path, entry: str) -> list[str]:
    path = Path(manifest)
    items: list[str] = json.loads(path.read_text(encoding="utf-8"))
    if entry in items:
        items.remove(entry)
    items.insert(0, entry)
    path.write_text(
        json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return items
