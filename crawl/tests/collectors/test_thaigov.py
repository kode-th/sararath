import json
from datetime import datetime, timezone
from pathlib import Path

from sararath.collectors.thaigov import (
    detail_url,
    discover_from_payload,
    list_url,
    parse_detail,
)
from sararath.domain.thai_date import parse_thai_date

FIXTURES = Path(__file__).parent.parent / "fixtures" / "thaigov"


def load(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def test_list_url_shape():
    assert list_url(1, 20).endswith("/v1/news/th?page=1&per_page=20")
    assert detail_url(167869).endswith("/v1/news/th/167869")


def test_discover_finds_items():
    items = discover_from_payload(load("list-page1.json"))
    assert len(items) == 5
    for item in items:
        assert item.external_id.startswith("thaigov-")
        assert "/th/news/" in item.url
        assert item.published_raw
        assert parse_thai_date(item.published_raw) is not None
    assert len({item.external_id for item in items}) == len(items)


def test_discover_tolerates_bad_payload():
    assert discover_from_payload({}) == []
    assert discover_from_payload({"data": None}) == []
    assert discover_from_payload({"data": [{"title": "no id"}]}) == []


def test_parse_detail():
    url = "https://www.thaigov.go.th/th/news/167869"
    article = parse_detail(load("detail-167869.json"), url)
    assert article.external_id == "thaigov-167869"
    assert article.canonical_url == url
    assert article.title.startswith("“อนุทิน” บุกนิวซีแลนด์")
    assert "นิวซีแลนด์" in article.body_text
    assert "<p>" not in article.body_text
    assert article.category == "ข่าวนายกรัฐมนตรี"
    assert article.agency_name == "รัฐบาลไทย"
    assert article.published_raw == "2026-08-20T13:00:00+07:00"
    assert article.published_at == datetime(2026, 8, 20, 6, 0, tzinfo=timezone.utc)
    assert article.language == "th"
    assert article.attachments
    assert article.attachments[0].startswith("http")


def test_parse_detail_collects_description_images():
    payload = {
        "id": 169217,
        "title": "t",
        "short_description": "",
        "description": '<div>x</div><img src="https://a/1.jpg"><img src="https://a/2.jpg">',
        "published_at": "2026-09-24T15:44:00+07:00",
        "thumbnail": "https://a/main.jpg",
    }
    article = parse_detail(payload, "https://www.thaigov.go.th/th/news/169217")
    assert article.attachments == (
        "https://a/main.jpg",
        "https://a/1.jpg",
        "https://a/2.jpg",
    )
