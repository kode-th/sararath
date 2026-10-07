from sararath.collectors.base import ParsedArticle
from sararath.pipeline.ingest import ingest


def make(suffix: str = "1", url: str = "https://x.go.th/1") -> ParsedArticle:
    return ParsedArticle(
        external_id=f"e-{suffix}",
        canonical_url=url,
        title=f"title {suffix}",
        summary="",
        body_text=f"body {suffix}",
        language="th",
        category="cat",
        agency_name="agency",
        published_at=None,
        published_raw="19 กันยายน 2569",
    )


def test_ingest_stats():
    result = ingest([make("1"), make("2", "https://x.go.th/2")])
    assert result.stats.found == 2
    assert result.stats.inserted == 2
    assert result.stats.skipped == 0
    assert result.articles[0]["published_raw"] == "19 กันยายน 2569"
    assert result.articles[0]["published_at"] is not None


def test_ingest_idempotent():
    batch = [make("1"), make("1", "https://x.go.th/1"), make("2", "https://x.go.th/2")]
    first = ingest(batch)
    assert (first.stats.found, first.stats.inserted, first.stats.skipped) == (3, 2, 1)
    second = ingest(batch)
    assert (second.stats.found, second.stats.inserted, second.stats.skipped) == (
        3,
        2,
        1,
    )
    assert [a["content_hash"] for a in first.articles] == [
        a["content_hash"] for a in second.articles
    ]
