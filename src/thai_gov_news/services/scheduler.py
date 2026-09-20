"""Due/stale selection over sources."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from thai_gov_news.models import Source


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _naive_utc(moment: datetime) -> datetime:
    if moment.tzinfo is not None:
        return moment.astimezone(timezone.utc).replace(tzinfo=None)
    return moment


def due_sources(session: Session, now: datetime | None = None) -> list[Source]:
    ref = _naive_utc(now or _utcnow())
    rows = session.scalars(
        select(Source).where(Source.enabled).order_by(Source.slug)
    ).all()
    return [
        s
        for s in rows
        if s.last_success_at is None
        or ref - _naive_utc(s.last_success_at)
        >= timedelta(minutes=s.crawl_interval_minutes)
    ]


def stale_sources(
    session: Session, max_age_hours: int = 26, now: datetime | None = None
) -> list[Source]:
    ref = _naive_utc(now or _utcnow())
    rows = session.scalars(
        select(Source).where(Source.enabled).order_by(Source.slug)
    ).all()
    return [
        s
        for s in rows
        if s.last_success_at is None
        or ref - _naive_utc(s.last_success_at) >= timedelta(hours=max_age_hours)
    ]
