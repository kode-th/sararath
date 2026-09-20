from datetime import datetime, timezone

from thai_gov_news.services.thai_date import parse_thai_date


def utc(*args: int) -> datetime:
    return datetime(*args, tzinfo=timezone.utc)


def test_full_month_be():
    assert parse_thai_date("19 กันยายน 2569") == utc(2026, 9, 18, 17, 0)


def test_abbrev_month_be():
    assert parse_thai_date("19 ก.ย. 2569") == utc(2026, 9, 18, 17, 0)


def test_be_marker():
    got = parse_thai_date("19 กันยายน พ.ศ. 2569")
    assert got == utc(2026, 9, 18, 17, 0)


def test_numeric_be():
    assert parse_thai_date("19/09/2569") == utc(2026, 9, 18, 17, 0)


def test_iso_ce_passthrough():
    assert parse_thai_date("2026-09-19") == utc(2026, 9, 18, 17, 0)


def test_time_component():
    got = parse_thai_date("19 กันยายน 2569 10:30")
    assert got == utc(2026, 9, 19, 3, 30)


def test_be_boundaries():
    assert parse_thai_date("1 มกราคม 2568") is not None
    assert parse_thai_date("31 ธันวาคม 2571") is not None


def test_invalid():
    assert parse_thai_date("") is None
    assert parse_thai_date("hello") is None
    assert parse_thai_date("32 มกราคม 2569") is None
    assert parse_thai_date("19 Foo 2569") is None
    assert parse_thai_date("19/09/9999") is None
