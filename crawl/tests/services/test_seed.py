from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from sararath.models import Base, Source
from sararath.services.seed import seed_sources


def memory_session() -> Session:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    from sqlalchemy.orm import sessionmaker

    return sessionmaker(bind=engine, expire_on_commit=False)()


def test_seed_inserts_then_updates():
    session = memory_session()
    inserted, updated = seed_sources(session, "sources/sources.yaml")
    assert inserted == 4
    assert updated == 0
    inserted, updated = seed_sources(session, "sources/sources.yaml")
    assert inserted == 0
    assert updated == 4


def test_seed_fields():
    from sqlalchemy import select

    session = memory_session()
    seed_sources(session, "sources/sources.yaml")
    moac = session.scalar(select(Source).where(Source.slug == "moac"))
    assert moac is not None
    assert moac.collector == "rss"
    assert moac.category == "ข่าวสารเกษตร"
    assert moac.feed_url is not None
    assert moac.feed_url.startswith("https://")
    session.close()
