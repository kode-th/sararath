import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from thai_gov_news.models import Article, Base, Source
from thai_gov_news.services.export_legacy import (
    export_date,
    post_from_article,
    update_manifest,
    write_export,
)

LEGACY_KEYS = {
    "id",
    "slug",
    "title",
    "topic",
    "agency",
    "origin",
    "priority",
    "urgency",
    "content",
    "source_url",
    "bd_opportunity",
    "tags",
    "category_label",
    "published_at",
}


def memory_session() -> Session:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)()


def seed(session: Session) -> None:
    source = Source(
        slug="thaigov",
        name_th="รัฐบาลไทย",
        homepage_url="https://www.thaigov.go.th/th/news",
        collector="thaigov",
    )
    session.add(source)
    session.flush()
    session.add_all(
        [
            Article(
                source_id=source.id,
                external_id="thaigov-1",
                canonical_url="https://www.thaigov.go.th/th/news/1",
                title="ข่าวตรง",
                body_text="เนื้อหา",
                category="ข่าวนายกรัฐมนตรี",
                agency_name="รัฐบาลไทย",
                published_at=datetime(2026, 9, 18, 10, 0, tzinfo=timezone.utc),
                published_raw="2026-09-18T17:00:00+07:00",
                content_hash="h1",
            ),
            Article(
                source_id=source.id,
                external_id="thaigov-2",
                canonical_url="https://example.com/x",
                title="ข่าวอ้อม",
                body_text="เนื้อหา",
                category="ทั่วไป",
                agency_name="รัฐบาลไทย",
                published_at=datetime(2026, 9, 18, 18, 0, tzinfo=timezone.utc),
                published_raw="2026-09-19T01:00:00+07:00",
                content_hash="h2",
            ),
            Article(
                source_id=source.id,
                external_id="thaigov-3",
                canonical_url="https://www.thaigov.go.th/th/news/3",
                title="ไม่มีวันตีพิมพ์",
                body_text="เนื้อหา",
                content_hash="h3",
            ),
        ]
    )
    session.commit()


def test_post_matches_legacy_keys():
    session = memory_session()
    seed(session)
    article = session.query(Article).filter_by(external_id="thaigov-1").one()
    post = post_from_article(article, "thaigov")
    assert set(post) == LEGACY_KEYS
    assert post["id"] == "thaigov-thaigov-1"
    assert post["origin"] == "direct"
    assert post["source_url"] == "https://www.thaigov.go.th/th/news/1"
    assert post["published_at"] == "2026-09-18"


def test_export_filters_bangkok_date():
    session = memory_session()
    seed(session)
    payload = export_date(session, "2026-09-18")
    assert payload["date"] == "2026-09-18"
    assert payload["pipeline"].startswith("thai-gov-news-")
    assert [p["id"] for p in payload["posts"]] == ["thaigov-thaigov-1"]
    assert payload["stats"] == {"total": 1, "direct": 1, "indirect": 0}
    payload = export_date(session, "2026-09-19")
    assert [p["id"] for p in payload["posts"]] == ["thaigov-thaigov-2"]
    assert payload["posts"][0]["origin"] == "indirect"


def test_export_rejects_bad_date():
    session = memory_session()
    try:
        export_date(session, "18-09-2026")
    except SystemExit as exc:
        assert "bad date" in str(exc)
    else:
        raise AssertionError("expected SystemExit")


def test_write_and_manifest(tmp_path: Path):
    session = memory_session()
    seed(session)
    payload = export_date(session, "2026-09-18")
    out = write_export(payload, tmp_path / "2026-09-18_news.json")
    assert json.loads(out.read_text(encoding="utf-8"))["date"] == "2026-09-18"
    manifest = tmp_path / "manifest.json"
    manifest.write_text('["2026-09-17_news.json"]', encoding="utf-8")
    items = update_manifest(manifest, out.name)
    assert items == ["2026-09-18_news.json", "2026-09-17_news.json"]
    items = update_manifest(manifest, out.name)
    assert items == ["2026-09-18_news.json", "2026-09-17_news.json"]
