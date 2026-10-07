from sararath.domain.dedupe import Article, content_hash, dedupe


def make(
    title: str = "t",
    body: str = "b",
    url: str = "https://x.go.th/1",
    external: str = "e1",
) -> Article:
    return {
        "title": title,
        "body_text": body,
        "canonical_url": url,
        "external_id": external,
    }


def test_hash_stable_and_case_insensitive():
    assert content_hash("T", "B") == content_hash("t", "b")


def test_duplicate_url_dropped():
    rows = dedupe([make(), make(external="e2")])
    assert len(rows) == 1


def test_duplicate_external_dropped():
    rows = dedupe([make(url="https://x.go.th/2"), make()])
    assert len(rows) == 1


def test_duplicate_content_cross_day_dropped():
    rows = dedupe([make(), make(url="https://x.go.th/9", external="e9")])
    assert len(rows) == 1
    assert rows[0]["content_hash"]


def test_distinct_kept():
    rows = dedupe([make(), make(title="other", url="https://x.go.th/2", external="e2")])
    assert len(rows) == 2
