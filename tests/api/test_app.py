from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from thai_gov_news.api.app import app, get_db
from thai_gov_news.models import Article, Base, Source


def client() -> TestClient:
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    session = factory()
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
                title="ข่าวใหม่",
                body_text="เนื้อหาใหม่",
                category="ข่าวนายกรัฐมนตรี",
                agency_name="รัฐบาลไทย",
                published_at=datetime(2026, 9, 18, 10, 0, tzinfo=timezone.utc),
                published_raw="2026-09-18T17:00:00+07:00",
                content_hash="h1",
            ),
            Article(
                source_id=source.id,
                external_id="thaigov-2",
                canonical_url="https://www.thaigov.go.th/th/news/2",
                title="ข่าวเก่า",
                body_text="เนื้อหาเก่า",
                category="ทั่วไป",
                agency_name="รัฐบาลไทย",
                published_at=datetime(2026, 9, 17, 10, 0, tzinfo=timezone.utc),
                published_raw="2026-09-17T17:00:00+07:00",
                content_hash="h2",
            ),
            Article(
                source_id=source.id,
                external_id="thaigov-3",
                canonical_url="https://www.thaigov.go.th/th/news/3",
                title="ไม่มีวันที่",
                body_text="เนื้อหา",
                content_hash="h3",
            ),
        ]
    )
    session.commit()
    app.dependency_overrides[get_db] = lambda: factory()
    return TestClient(app)


def test_list_order_and_cursor():
    seen: list[str] = []
    cursor: str | None = None
    api = client()
    for _ in range(3):
        params: dict[str, str] = {"limit": "1"}
        if cursor:
            params["cursor"] = cursor
        res = api.get("/v1/articles", params=params)
        assert res.status_code == 200
        body = res.json()
        assert len(body["items"]) == 1
        seen.append(body["items"][0]["title"])
        cursor = body["next_cursor"]
    assert seen == ["ข่าวใหม่", "ข่าวเก่า", "ไม่มีวันที่"]
    assert cursor is None


def test_filters():
    assert client().get("/v1/articles", params={"source": "prd"}).json()["items"] == []
    res = client().get("/v1/articles", params={"q": "ข่าวเก่า"})
    assert [i["title"] for i in res.json()["items"]] == ["ข่าวเก่า"]
    res = client().get(
        "/v1/articles",
        params={"published_from": "2026-09-18", "published_to": "2026-09-18"},
    )
    assert [i["title"] for i in res.json()["items"]] == ["ข่าวใหม่"]
    assert (
        client().get("/v1/articles", params={"published_from": "xx"}).status_code == 422
    )
    assert client().get("/v1/articles", params={"limit": "0"}).status_code == 422


def test_detail_and_errors():
    api = client()
    first = api.get("/v1/articles", params={"limit": "1"}).json()["items"][0]
    assert first["source"] == {"slug": "thaigov", "name_th": "รัฐบาลไทย"}
    assert first["canonical_url"].startswith("https://")
    assert first["retrieved_at"] is not None
    res = api.get(f"/v1/articles/{first['id']}")
    assert res.json()["title"] == "ข่าวใหม่"
    assert (
        api.get("/v1/articles/00000000-0000-0000-0000-000000000000").status_code == 404
    )
    assert api.get("/v1/articles/nope").status_code == 422


def test_sources_and_health():
    sources = client().get("/v1/sources").json()["items"]
    assert [s["slug"] for s in sources] == ["thaigov"]
    health = client().get("/v1/health").json()
    assert health["db"] == "ok"
    assert health["sources"][0]["slug"] == "thaigov"
