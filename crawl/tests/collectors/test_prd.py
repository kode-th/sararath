import json
from datetime import datetime, timezone
from pathlib import Path

from sararath.collectors.prd import discover_from_json, parse_article

FIXTURES = Path(__file__).parent.parent / "fixtures" / "prd"


def read(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def test_discover_from_json_dedupes():
    items = discover_from_json(json.loads(read("list.json")))
    assert len(items) == 2
    for item in items:
        assert item.external_id.startswith("prd-")
        assert item.url.startswith("https://prd.go.th/main/article/")
        assert item.published_raw
    assert len({item.external_id for item in items}) == len(items)


def test_parse_article():
    url = "https://prd.go.th/main/article/b8b38f97-6b4b-47ba-8ccf-47776c792710"
    article = parse_article(read("article.html"), url)
    assert article.external_id == "prd-b8b38f97-6b4b-47ba-8ccf-47776c792710"
    assert article.canonical_url == url
    assert article.title.startswith("รัฐบาลเร่งเตรียมความพร้อม")
    assert "ย่อหน้าแรกของบทความ" in article.body_text
    assert "ย่อหน้าที่สอง" in article.body_text
    # The trailing "ที่มา : <url>" credit is dropped.
    assert "thaigov.go.th" not in article.body_text
    # Body is paragraphs, not one flattened line.
    assert "\n\n" in article.body_text
    assert article.published_at == datetime(2026, 10, 7, 4, 51, 11, tzinfo=timezone.utc)
    assert article.published_raw == "2026-10-07T04:51:11+00:00"
    assert article.language == "th"
    assert article.agency_name == "กรมประชาสัมพันธ์"
    assert article.attachments == (
        "https://api-supabase.prd.softsq.com/storage/v1/object/public/cms-softsq/cover-uuid",
        "https://api-supabase.prd.softsq.com/storage/v1/object/public/cms-softsq/gallery-uuid",
    )


def test_parse_article_without_next_data():
    url = "https://prd.go.th/main/article/abc"
    article = parse_article("<html><body>no data</body></html>", url)
    assert article.external_id == "prd-abc"
    assert article.title == ""
    assert article.body_text == ""
    assert article.published_at is None
    assert article.attachments == ()
