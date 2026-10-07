"""Idempotent ingest: ParsedArticle -> normalize -> dedupe + run stats."""

from __future__ import annotations

from dataclasses import asdict, dataclass

from sararath.collectors.base import ParsedArticle
from sararath.services.dedupe import Article, dedupe
from sararath.services.normalize import NormalizedRecord, normalize_record


@dataclass(frozen=True)
class IngestStats:
    found: int
    inserted: int
    skipped: int


@dataclass(frozen=True)
class IngestResult:
    articles: list[Article]
    stats: IngestStats


def ingest(parsed: list[ParsedArticle]) -> IngestResult:
    records: list[NormalizedRecord] = [
        normalize_record(asdict(item)) for item in parsed
    ]
    rows: list[Article] = [dict(record) for record in records]
    for row, item in zip(rows, parsed):
        if item.summary:
            row["summary"] = item.summary
        if item.attachments:
            row["attachments"] = list(item.attachments)
    kept = dedupe(rows)
    found = len(parsed)
    return IngestResult(
        articles=kept,
        stats=IngestStats(
            found=found,
            inserted=len(kept),
            skipped=found - len(kept),
        ),
    )
