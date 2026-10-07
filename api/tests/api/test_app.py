from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from thai_gov_news.api.app import app, get_db
from thai_gov_news.models import Article, Base, Source


def client(duplicate_titles: int = 0) -> TestClient:
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
    for index in range(duplicate_titles):
        session.add(
            Article(
                source_id=source.id,
                external_id=f"thaigov-dup-{index}",
                canonical_url=f"https://www.thaigov.go.th/th/news/dup-{index}",
                title="ข่าวใหม่",
                body_text="เนื้อหาซ้ำ",
                category="ทั่วไป",
                agency_name="รัฐบาลไทย",
                published_at=datetime(2026, 9, 18, 11, 0, tzinfo=timezone.utc),
                published_raw="2026-09-18T18:00:00+07:00",
                content_hash=f"dup{index}",
            )
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
    assert first["last_seen_at"] is not None
    res = api.get(f"/v1/articles/{first['id']}")
    assert res.json()["title"] == "ข่าวใหม่"
    assert (
        api.get("/v1/articles/00000000-0000-0000-0000-000000000000").status_code == 404
    )
    assert api.get("/v1/articles/nope").status_code == 422


def test_suggest():
    api = client()
    body = api.get("/v1/suggest", params={"q": "รัฐบาล"}).json()
    assert [s["slug"] for s in body["sources"]] == ["thaigov"]
    assert body["articles"] == []
    body = api.get("/v1/suggest", params={"q": "ข่าว"}).json()
    assert body["sources"] == []
    assert [a["title"] for a in body["articles"]] == ["ข่าวใหม่", "ข่าวเก่า"]
    assert api.get("/v1/suggest", params={"q": " "}).json() == {
        "sources": [],
        "articles": [],
    }
    assert api.get("/v1/suggest", params={"limit": "0"}).status_code == 422


def test_suggest_dedupes_titles():
    body = client(duplicate_titles=1).get("/v1/suggest", params={"q": "ข่าว"}).json()
    assert [a["title"] for a in body["articles"]] == ["ข่าวใหม่", "ข่าวเก่า"]


def test_sources_and_health():
    api = client()
    sources = api.get("/v1/sources").json()["items"]
    assert [s["slug"] for s in sources] == ["thaigov"]
    health = api.get("/v1/health").json()
    assert health["db"] == "ok"
    assert health["sources"][0]["slug"] == "thaigov"


def test_categories():
    counted = {
        item["value"]: item["count"]
        for item in client().get("/v1/categories").json()["items"]
    }
    assert counted == {"ข่าวนายกรัฐมนตรี": 1, "ทั่วไป": 1}
    assert (
        client().get("/v1/categories", params={"source": "prd"}).json()["items"] == []
    )


def test_reference():
    res = client().get("/reference")
    assert res.status_code == 200
    assert "scalar" in res.text
    assert "/openapi.json" in res.text


def test_runs_empty_and_limit():
    api = client()
    assert api.get("/v1/runs").json() == {"items": []}
    assert api.get("/v1/runs", params={"limit": "0"}).status_code == 422


def test_cors_allowlist():
    res = client().get("/v1/health", headers={"Origin": "https://example.com"})
    assert res.headers["access-control-allow-origin"] == "*"
