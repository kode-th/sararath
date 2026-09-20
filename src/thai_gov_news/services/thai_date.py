"""Thai date parsing: Buddhist Era + Thai month names -> UTC.

Assumes datetimes are Asia/Bangkok local when no zone given.
Returns None for unparseable input; never raises.
"""

from __future__ import annotations

import re
from datetime import datetime
from zoneinfo import ZoneInfo

_BANGKOK = ZoneInfo("Asia/Bangkok")

_MONTHS = {
    "มกราคม": 1,
    "กุมภาพันธ์": 2,
    "มีนาคม": 3,
    "เมษายน": 4,
    "พฤษภาคม": 5,
    "มิถุนายน": 6,
    "กรกฎาคม": 7,
    "สิงหาคม": 8,
    "กันยายน": 9,
    "ตุลาคม": 10,
    "พฤศจิกายน": 11,
    "ธันวาคม": 12,
    "ม.ค.": 1,
    "ก.พ.": 2,
    "มี.ค.": 3,
    "เม.ย.": 4,
    "พ.ค.": 5,
    "มิ.ย.": 6,
    "ก.ค.": 7,
    "ส.ค.": 8,
    "ก.ย.": 9,
    "ต.ค.": 10,
    "พ.ย.": 11,
    "ธ.ค.": 12,
}

_TEXT_RE = re.compile(
    r"(?P<day>\d{1,2})\s+(?P<month>\S+)\s+(?:พ\.ศ\.\s+)?(?P<year>\d{4})"
    r"(?:\s+(?P<hour>\d{1,2}):(?P<minute>\d{2}))?"
)
_NUMERIC_RE = re.compile(
    r"(?P<day>\d{1,2})[/-](?P<month>\d{1,2})[/-](?P<year>\d{4})"
    r"(?:\s+(?P<hour>\d{1,2}):(?P<minute>\d{2}))?"
)
_ISO_RE = re.compile(
    r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})"
    r"(?:[T ](?P<hour>\d{2}):(?P<minute>\d{2}))?"
)


def _to_utc(year: int, month: int, day: int, hour: int, minute: int) -> datetime | None:
    if 2400 <= year <= 2600:
        year -= 543
    elif not 1900 <= year <= 2100:
        return None
    try:
        local = datetime(year, month, day, hour, minute, tzinfo=_BANGKOK)
    except ValueError:
        return None
    return local.astimezone(ZoneInfo("UTC"))


def parse_thai_date(text: str) -> datetime | None:
    """Parse Thai BE/CE date text into UTC datetime. None when unparseable."""
    text = (text or "").strip()
    if not text:
        return None

    match = _TEXT_RE.search(text)
    if match:
        month = _MONTHS.get(match.group("month"))
        if month is None:
            return None
        return _to_utc(
            int(match.group("year")),
            month,
            int(match.group("day")),
            int(match.group("hour") or 0),
            int(match.group("minute") or 0),
        )

    match = _NUMERIC_RE.search(text) or _ISO_RE.search(text)
    if match:
        return _to_utc(
            int(match.group("year")),
            int(match.group("month")),
            int(match.group("day")),
            int(match.group("hour") or 0),
            int(match.group("minute") or 0),
        )

    return None
