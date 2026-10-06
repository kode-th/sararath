from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from thai_gov_news.models import Article, Base, Source
from thai_gov_news.services.links import (
    moac_article_url,
    normalizer_for,
    repair_links,
)


def test_moac_article_url_collapses_chains():
    chained = (
        "http://www.moac.go.th/jakarta-news-news_release-preview-1-"
        "preview-2-preview-482791791138"
    )
    assert moac_article_url(chained) == (
        "https://www.moac.go.th/news-news_release-preview-482791791138"
    )


def test_moac_article_url_is_idempotent_and_leaves_others():
    clean = "https://www.moac.go.th/news-news_release-preview-99"
    assert moac_article_url(clean) == clean
    assert moac_article_url("https://www.youtube.com/watch?v=x") == (
        "https://www.youtube.com/watch?v=x"
    )
    assert moac_article_url("https://www.moac.go.th/dwl-preview-5") == (
        "https://www.moac.go.th/dwl-preview-5"
    )


def test_normalizer_for():
    assert normalizer_for("moac") is moac_article_url
    assert normalizer_for("rd") is None


def test_repair_links_rewrites_stored_urls():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, expire_on_commit=False)()
    source = Source(slug="moac", name_th="ก", homepage_url="https://m", collector="rss")
    session.add(source)
    session.flush()
    session.add(
        Article(
            source_id=source.id,
            external_id="x",
            canonical_url=(
                "http://www.moac.go.th/jakarta-news-news_release-preview-1-preview-22"
            ),
            title="t",
            body_text="b",
            content_hash="h",
        )
    )
    session.commit()

    dry = repair_links(session, source="moac", dry_run=True)
    assert (dry.checked, dry.updated) == (1, 1)
    stored = session.scalar(select(Article))
    assert stored is not None
    assert stored.canonical_url.endswith("preview-1-preview-22")

    result = repair_links(session, source="moac")
    assert (result.checked, result.updated) == (1, 1)
    fixed = session.scalar(select(Article))
    assert fixed is not None
    assert fixed.canonical_url == "https://www.moac.go.th/news-news_release-preview-22"
