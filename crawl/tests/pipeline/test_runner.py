from datetime import datetime, timezone

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from sararath.collectors.base import ParsedArticle
from sararath.models import Article, Attachment, Base, CollectorRun, Source
from sararath.pipeline import runner


def memory_session() -> Session:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)()


def seed(session: Session) -> None:
    session.add(
        Source(
            slug="prd",
            name_th="กรมประชาสัมพันธ์",
            homepage_url="https://www.prd.go.th",
            collector="prd",
        )
    )
    session.commit()


def item(attachments: tuple[str, ...] = ()) -> ParsedArticle:
    return ParsedArticle(
        external_id="prd-1",
        canonical_url="https://www.prd.go.th/th/content/detail/1",
        title="ข่าว",
        summary="",
        body_text="เนื้อหา",
        language="th",
        category="ข่าวภาครัฐ",
        agency_name="กรมประชาสัมพันธ์",
        published_at=None,
        published_raw="",
        attachments=attachments,
    )


async def one() -> list[tuple[ParsedArticle, str | None, str]]:
    return [(item(), "<html>ข่าว</html>", ".html")]


def test_crawl_inserts_then_bumps(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(runner, "_collect_prd", one)
    session = memory_session()
    seed(session)
    first = runner.run_crawl(session, "prd")
    assert (first.found, first.inserted, first.skipped) == (1, 1, 0)
    stored = session.scalar(select(Article))
    assert stored is not None
    assert stored.raw_path is not None
    assert "raw/prd" in stored.raw_path
    assert stored.last_seen_at is not None
    first_seen = stored.last_seen_at.replace(tzinfo=None)
    run = session.scalar(select(CollectorRun))
    assert run is not None
    assert run.status == "ok"
    assert run.http_status == 200
    second = runner.run_crawl(session, "prd")
    assert (second.found, second.inserted, second.skipped) == (1, 0, 1)
    again = session.scalar(select(Article))
    assert again is not None
    assert again.last_seen_at is not None
    assert again.last_seen_at.replace(tzinfo=None) >= first_seen
    assert session.scalar(select(Article).where(Article.raw_path.is_(None))) is None


def test_crawl_backfills_missing_attachments(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    session = memory_session()
    seed(session)
    monkeypatch.setattr(runner, "_collect_prd", one)

    async def keep_all(articles):
        return articles

    monkeypatch.setattr(runner, "filter_broken_attachments", keep_all)
    runner.run_crawl(session, "prd")
    image = "https://www.prd.go.th/th/file/get/file/a.jpeg"

    async def with_image() -> list[tuple[ParsedArticle, str | None, str]]:
        return [(item((image,)), "<html>ข่าว</html>", ".html")]

    monkeypatch.setattr(runner, "_collect_prd", with_image)
    runner.run_crawl(session, "prd")
    runner.run_crawl(session, "prd")
    assert session.scalars(select(Attachment.url)).all() == [image]


def story(url: str, body: str) -> ParsedArticle:
    return ParsedArticle(
        external_id=url,
        canonical_url=url,
        title="น้ำท่วม",
        summary="",
        body_text=body,
        language="th",
        category="ข่าวภาครัฐ",
        agency_name="กรมประชาสัมพันธ์",
        published_at=datetime(2026, 9, 22, 10, 0, tzinfo=timezone.utc),
        published_raw="",
        attachments=(),
    )


def test_crawl_stores_one_row_per_story(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    session = memory_session()
    seed(session)

    async def variants() -> list[tuple[ParsedArticle, str | None, str]]:
        return [
            (story("https://x/1", "stub"), None, ".html"),
            (story("https://x/2", "the full body text"), None, ".html"),
        ]

    monkeypatch.setattr(runner, "_collect_prd", variants)
    first = runner.run_crawl(session, "prd")
    assert (first.found, first.inserted) == (2, 1)
    stored = session.scalars(select(Article)).all()
    assert [a.body_text for a in stored] == ["the full body text"]

    async def new_url() -> list[tuple[ParsedArticle, str | None, str]]:
        return [(story("https://x/3", "the full body text"), None, ".html")]

    monkeypatch.setattr(runner, "_collect_prd", new_url)
    second = runner.run_crawl(session, "prd")
    assert (second.found, second.inserted) == (1, 0)
    stored = session.scalars(select(Article)).all()
    assert len(stored) == 1
    assert stored[0].canonical_url == "https://x/3"
