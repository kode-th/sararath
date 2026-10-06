from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from thai_gov_news.collectors.base import ParsedArticle
from thai_gov_news.models import Article, Attachment, Base, CollectorRun, Source
from thai_gov_news.services import runner


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
    runner.run_crawl(session, "prd")
    image = "https://www.prd.go.th/th/file/get/file/a.jpeg"

    async def with_image() -> list[tuple[ParsedArticle, str | None, str]]:
        return [(item((image,)), "<html>ข่าว</html>", ".html")]

    monkeypatch.setattr(runner, "_collect_prd", with_image)
    runner.run_crawl(session, "prd")
    runner.run_crawl(session, "prd")
    assert session.scalars(select(Attachment.url)).all() == [image]
