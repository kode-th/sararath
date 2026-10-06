from datetime import datetime, timezone

from thai_gov_news.services.normalize import (
    normalize_record,
    normalize_url,
    normalize_whitespace,
)


def test_whitespace_collapse():
    assert normalize_whitespace("  a \n b\t c  ") == "a b c"
    assert normalize_whitespace("") == ""


def test_url_canonical():
    assert normalize_url("HTTPS://WWW.GO.TH/Path/#frag") == "https://www.go.th/Path"
    assert normalize_url("https://www.go.th/a/") == "https://www.go.th/a"
    assert normalize_url("not a url") == "not a url"


def test_record_uses_thai_date():
    record = normalize_record(
        {
            "title": "  ข่าว  ทดสอบ ",
            "body_text": "เนื้อหา",
            "canonical_url": "https://www.thaigov.go.th/th/news#x",
            "published_raw": "19 กันยายน 2569",
            "agency_name": "รัฐบาลไทย",
        }
    )
    assert record["title"] == "ข่าว ทดสอบ"
    assert record["canonical_url"] == "https://www.thaigov.go.th/th/news"
    assert record["published_raw"] == "19 กันยายน 2569"
    assert record["published_at"] == datetime(2026, 9, 18, 17, 0, tzinfo=timezone.utc)


def test_record_invalid_date():
    record = normalize_record({"title": "t", "published_raw": "nonsense"})
    assert record["published_at"] is None
    assert record["published_raw"] == "nonsense"
