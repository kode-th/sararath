from pathlib import Path

from thai_gov_news.collectors.rss import FeedConfig, parse_feed

FIXTURES = Path(__file__).parent.parent / "fixtures" / "rss"

MOAC = FeedConfig(
    slug="moac",
    feed_url="https://www.moac.go.th/all_rss/news-type-382791791792-382791791792.xml",
    agency_name="กระทรวงเกษตรและสหกรณ์",
    category="ข่าวสารเกษตร",
)


def test_parse_moac_feed():
    payload = (FIXTURES / "moac-news.xml").read_bytes()
    articles = parse_feed(payload, MOAC)
    assert len(articles) > 100
    first = articles[0]
    assert first.external_id.startswith("moac-")
    assert first.canonical_url.startswith("http")
    assert first.title
    assert first.agency_name == "กระทรวงเกษตรและสหกรณ์"
    assert first.language == "th"


def test_feed_dates_parse():
    payload = (FIXTURES / "moac-news.xml").read_bytes()
    articles = parse_feed(payload, MOAC)
    dated = [a for a in articles if a.published_at is not None]
    assert len(dated) > 100
    assert all(a.published_raw for a in dated)


RD = FeedConfig(
    slug="rd",
    feed_url="https://www.rd.go.th/publish.xml",
    agency_name="กรมสรรพากร",
    category="ข่าวประชาสัมพันธ์",
)


def test_parse_rd_feed():
    payload = (FIXTURES / "rd-publish.xml").read_bytes()
    articles = parse_feed(payload, RD)
    assert len(articles) == 30
    first = articles[0]
    assert first.external_id == "rd-news-12313"
    assert first.canonical_url.endswith("news22_2569.pdf")
    assert first.published_raw == "Tue, 15 Sep 2026 10:55:00 +0700"
    assert first.published_at is not None
    assert first.published_at.tzinfo is not None
