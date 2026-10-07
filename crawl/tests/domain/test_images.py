import asyncio
from datetime import datetime, timezone

import httpx
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from sararath.collectors.base import ParsedArticle
from sararath.models import Article, Attachment, Base, Source
from sararath.domain import images


def article(urls: tuple[str, ...]) -> ParsedArticle:
    return ParsedArticle(
        external_id="x",
        canonical_url="https://x/1",
        title="t",
        summary="",
        body_text="b",
        language="th",
        category="",
        agency_name="a",
        published_at=None,
        published_raw="",
        attachments=urls,
    )


def test_filter_broken_attachments(monkeypatch):
    async def fake_is_image(_client, url):
        return not url.endswith("bad.jpg")

    monkeypatch.setattr(images, "_is_image", fake_is_image)
    result = asyncio.run(
        images.filter_broken_attachments(
            [article(("https://x/good.jpg", "https://x/bad.jpg")), article(())]
        )
    )
    assert result[0].attachments == ("https://x/good.jpg",)
    assert result[1].attachments == ()


def test_is_image_uses_status_and_content_type(monkeypatch):
    async def no_wait(_url):
        return None

    monkeypatch.setattr(images.limiter, "wait", no_wait)

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/ok":
            return httpx.Response(
                200, headers={"content-type": "image/jpeg"}, content=b"x"
            )
        if request.url.path == "/html":
            return httpx.Response(
                200, headers={"content-type": "text/html"}, content=b"x"
            )
        return httpx.Response(404)

    async def run():
        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as client:
            assert await images._is_image(client, "https://x/ok") is True
            assert await images._is_image(client, "https://x/html") is False
            assert await images._is_image(client, "https://x/missing") is False

    asyncio.run(run())


def memory_session() -> Session:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)()


def test_prune_attachments(monkeypatch):
    session = memory_session()
    source = Source(slug="prd", name_th="ก", homepage_url="https://p", collector="prd")
    session.add(source)
    session.flush()
    now = datetime(2026, 9, 22, tzinfo=timezone.utc)
    stored = Article(
        source_id=source.id,
        external_id="x",
        canonical_url="u",
        title="t",
        body_text="b",
        content_hash="h",
        first_seen_at=now,
        last_seen_at=now,
    )
    session.add(stored)
    session.flush()
    session.add_all(
        [
            Attachment(article_id=stored.id, url="https://x/good.jpg"),
            Attachment(article_id=stored.id, url="https://x/bad.jpg"),
        ]
    )
    session.commit()

    async def fake_resolve(urls):
        return {u for u in urls if u.endswith("good.jpg")}

    monkeypatch.setattr(images, "resolve_images", fake_resolve)
    dry = images.prune_attachments(session, dry_run=True)
    assert (dry.scanned, dry.removed) == (2, 1)
    assert len(session.scalars(select(Attachment)).all()) == 2

    result = images.prune_attachments(session)
    assert (result.scanned, result.removed) == (2, 1)
    assert session.scalars(select(Attachment.url)).all() == ["https://x/good.jpg"]
