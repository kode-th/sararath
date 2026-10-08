"""Due/stale selection over sources."""

from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from sararath.clock import naive_utc, utcnow
from sararath.models import Source


def due_sources(session: Session, now: datetime | None = None) -> list[Source]:
    ref = naive_utc(now or utcnow())
    rows = session.scalars(
        select(Source).where(Source.enabled).order_by(Source.slug)
    ).all()
    return [
        s
        for s in rows
        if s.last_success_at is None
        or ref - naive_utc(s.last_success_at)
        >= timedelta(minutes=s.crawl_interval_minutes)
    ]


def stale_sources(
    session: Session, max_age_hours: int = 26, now: datetime | None = None
) -> list[Source]:
    ref = naive_utc(now or utcnow())
    rows = session.scalars(
        select(Source).where(Source.enabled).order_by(Source.slug)
    ).all()
    return [
        s
        for s in rows
        if s.last_success_at is None
        or ref - naive_utc(s.last_success_at) >= timedelta(hours=max_age_hours)
    ]
