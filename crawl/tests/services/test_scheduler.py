from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from sararath.models import Base, Source
from sararath.services.scheduler import due_sources, stale_sources


def memory_session() -> Session:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)()


NOW = datetime(2026, 9, 20, 12, 0, tzinfo=timezone.utc)


def seed(session: Session) -> None:
    session.add_all(
        [
            Source(
                slug="fresh",
                name_th="f",
                homepage_url="https://x.go.th",
                collector="rss",
                crawl_interval_minutes=60,
                last_success_at=NOW - timedelta(minutes=30),
            ),
            Source(
                slug="due",
                name_th="d",
                homepage_url="https://x.go.th",
                collector="rss",
                crawl_interval_minutes=60,
                last_success_at=NOW - timedelta(minutes=61),
            ),
            Source(
                slug="never",
                name_th="n",
                homepage_url="https://x.go.th",
                collector="rss",
                crawl_interval_minutes=60,
            ),
            Source(
                slug="off",
                name_th="o",
                homepage_url="https://x.go.th",
                collector="rss",
                enabled=False,
            ),
        ]
    )
    session.commit()


def test_due_sources():
    session = memory_session()
    seed(session)
    assert [s.slug for s in due_sources(session, NOW)] == ["due", "never"]


def test_stale_sources():
    session = memory_session()
    seed(session)
    assert [s.slug for s in stale_sources(session, 26, NOW)] == ["never"]
    assert [s.slug for s in stale_sources(session, 0, NOW)] == [
        "due",
        "fresh",
        "never",
    ]
