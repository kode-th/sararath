from datetime import datetime, timezone

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from thai_gov_news.models import Article, Attachment, Base, Source
from thai_gov_news.services.cleanup import dedupe_articles, strip_script_text


def memory_session() -> Session:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)()


def add_article(
    session: Session,
    source_id: object,
    url: str,
    body: str,
    first_seen: datetime,
) -> Article:
    article = Article(
        source_id=source_id,
        external_id=url,
        canonical_url=url,
        title="ซ้ำ",
        body_text=body,
        category="",
        agency_name="กรม",
        published_at=datetime(2026, 9, 22, 10, 0, tzinfo=timezone.utc),
        published_raw="",
        content_hash=url,
        first_seen_at=first_seen,
        last_seen_at=first_seen,
    )
    session.add(article)
    session.flush()
    return article


def test_dedupe_keeps_richest_body_and_drops_attachments():
    session = memory_session()
    source = Source(slug="moac", name_th="ก", homepage_url="https://m", collector="rss")
    session.add(source)
    session.flush()
    keep = add_article(
        session,
        source.id,
        "u1",
        "full body",
        datetime(2026, 9, 22, tzinfo=timezone.utc),
    )
    stub = add_article(
        session, source.id, "u2", "x", datetime(2026, 9, 23, tzinfo=timezone.utc)
    )
    session.add(Attachment(article_id=stub.id, url="https://m/img.jpg"))
    session.commit()

    dry = dedupe_articles(session, dry_run=True)
    assert (dry.groups, dry.removed) == (1, 1)
    assert len(session.scalars(select(Article)).all()) == 2

    result = dedupe_articles(session)
    assert (result.groups, result.removed) == (1, 1)
    assert [a.id for a in session.scalars(select(Article)).all()] == [keep.id]
    assert session.scalars(select(Attachment)).all() == []


def test_strip_script_text():
    session = memory_session()
    source = Source(slug="prd", name_th="ก", homepage_url="https://p", collector="prd")
    session.add(source)
    session.flush()
    session.add(
        Article(
            source_id=source.id,
            external_id="x",
            canonical_url="u",
            title="t",
            body_text="เนื้อหา\n\nข้อมูลจาก https://x รูปภาพ jQuery(function() { });",
            content_hash="h",
        )
    )
    session.commit()

    dry = strip_script_text(session, source="prd", dry_run=True)
    assert (dry.scanned, dry.cleaned) == (1, 1)
    stored = session.scalar(select(Article))
    assert stored is not None
    assert "jQuery(" in stored.body_text

    result = strip_script_text(session, source="prd")
    assert (result.scanned, result.cleaned) == (1, 1)
    fixed = session.scalar(select(Article))
    assert fixed is not None
    assert fixed.body_text == "เนื้อหา\n\nข้อมูลจาก https://x รูปภาพ"
