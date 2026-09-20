from datetime import datetime, timezone
from pathlib import Path

from thai_gov_news.collectors.prd import discover_from_html, parse_article
from thai_gov_news.services.thai_date import parse_thai_date

FIXTURES = Path(__file__).parent.parent / "fixtures" / "prd"


def read(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def test_discover_finds_cards():
    items = discover_from_html(read("list.html"))
    assert len(items) >= 2
    for item in items:
        assert item.external_id.startswith("prd-")
        assert "/iid/" in item.url
        assert item.published_raw
        assert parse_thai_date(item.published_raw) is not None
    assert len({item.external_id for item in items}) == len(items)


def test_parse_article():
    url = "https://www.prd.go.th/th/content/category/detail/id/39/iid/543058"
    article = parse_article(read("article-543058.html"), url)
    assert article.external_id == "prd-543058"
    assert article.canonical_url == url
    assert article.title.startswith("รัฐบาลย้ำค่าป่วยการ อสม.")
    assert "ค่าป่วยการ" in article.body_text
    assert article.published_raw == "20/09/2569"
    assert article.published_at == datetime(2026, 9, 19, 17, 0, tzinfo=timezone.utc)
    assert article.language == "th"
    assert article.agency_name == "กรมประชาสัมพันธ์"
