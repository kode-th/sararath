# thai-gov-news API

Python service: collectors, Postgres (Neon), FastAPI read API.

- Crawl: `uv run python -m thai_gov_news crawl --source prd`
- Serve: `uv run python -m thai_gov_news serve --port 8001`
- Migrate: `uv run python -m alembic upgrade head`

See the [root README](../README.md) for the full project.
