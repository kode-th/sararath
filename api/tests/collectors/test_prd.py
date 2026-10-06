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
    # Inline script/style text must not leak into the body.
    for junk in ("function(", "jQuery(", "$("):
        assert junk not in article.body_text
    # Body is paragraphs, not one flattened line.
    assert "\n\n" in article.body_text
    assert article.published_at == datetime(2026, 9, 19, 17, 0, tzinfo=timezone.utc)
    assert article.language == "th"
    assert article.agency_name == "กรมประชาสัมพันธ์"
    assert article.attachments[0].startswith("https://www.prd.go.th/")


def test_parse_article_collects_gallery_images():
    html = (
        '<html><head><meta property="og:image" '
        'content="https://www.prd.go.th/og.jpg"></head><body>'
        '<div class="article-detail">'
        '<div class="article-detail"><p>body</p></div></div>'
        '<div class="article-gallery">'
        '<img src="/images/icons/icon_gallery.png">'
        '<img src="/th/file/get/type/thumbnail/file/a.jpg">'
        '<img src="https://www.prd.go.th/th/file/get/type/thumbnail/file/b.jpg">'
        "</div></body></html>"
    )
    article = parse_article(
        html, "https://www.prd.go.th/th/content/category/detail/id/39/iid/1"
    )
    assert article.attachments == (
        "https://www.prd.go.th/og.jpg",
        "https://www.prd.go.th/th/file/get/file/a.jpg",
        "https://www.prd.go.th/th/file/get/file/b.jpg",
    )
