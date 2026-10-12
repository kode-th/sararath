# Sararath crawlers

Python 3.13 service (uv, `uv_build` src-layout, distribution `sararath-crawl`, import package `sararath`) that crawls Thai government sites into Postgres, the only writer of the shared database. The read API is a separate Cloudflare Worker in [`../api`](../api); see the [root README](../README.md) for the full project.

## Layout

```txt
src/sararath/
  cli.py           command-line entrypoint
  database.py      engine + session factory (DATABASE_URL required, no default)
  models.py        SQLAlchemy: sources, articles, attachments, collector_runs
  collectors/      base, http, html, rss, prd, moac, thaigov
  pipeline/        runner, scheduler, ingest, seed
  domain/          normalize, thai_date, links, images, dedupe
  maintenance/     backfill, cleanup, export_legacy
migrations/        alembic (env.py + versions/)
sources/           sources.yaml
tests/             pytest (collectors/, pipeline/, domain/, maintenance/)
typings/           pyi stubs (feedparser, yaml)
Dockerfile         base + prod + dev stages
```

## Setup

```bash
uv sync
export DATABASE_URL='postgresql+psycopg://user:pass@host/db?sslmode=require'
uv run python -m alembic upgrade head
uv run python -m sararath seed            # upsert sources from sources.yaml
```

`DATABASE_URL` is required. The app can use the Neon pooled host; alembic works on either.

## CLI

Run from `crawl/` as `uv run python -m sararath <command>`; bare `uv run pytest` / `uv run alembic` can fail to spawn in some environments. Also installed as the console script `sararath`.

```bash
uv run python -m sararath seed
uv run python -m sararath crawl --source prd          # one source
uv run python -m sararath crawl-due                   # all due (respects intervals)
uv run python -m sararath crawl-due --source rd       # restrict
uv run python -m sararath check --max-age-hours 26    # exit 1 when stale
uv run python -m sararath export-legacy --date 2026-09-20 --out data.json
uv run python -m sararath backfill-body --source moac  # re-fetch bodies (prd, moac); --single-line for long single-line only
uv run python -m sararath dedupe-articles --source moac --dry-run  # drop duplicate rows
uv run python -m sararath repair-links --source moac --dry-run    # fix malformed source URLs
uv run python -m sararath strip-script --source prd --dry-run     # drop leaked script text
uv run python -m sararath prune-attachments --source prd --dry-run # drop image URLs that don't resolve
```

## Migrations

The database schema is owned here; the read API only queries it. After changing `models.py`:

```bash
uv run python -m alembic revision --autogenerate -m "…"
uv run python -m alembic upgrade head
```

## Collectors and cadence

`sources/sources.yaml` defines each source and its `crawl_interval_minutes` (prd/thaigov 60, moac/rd 120). `crawl-due` crawls a source only when `now - last_success_at >= interval`, so a failure retries on the next tick. Collectors use `httpx` for fetch, `selectolax` (lexbor) for HTML, and `feedparser` for RSS.

## Crawling policy

The crawlers read public pages only. They follow these rules, set in `collectors/http.py`:

- One request per host every 2 seconds (`MIN_INTERVAL`), with at most 3 retries and backoff on errors.
- The User-Agent ends in `ThaiGovNewsBot/1.0`, so site operators can identify the crawler.
- Before each fetch, the crawler reads the host's `robots.txt` and skips disallowed URLs.

One source has an exception, listed in `ROBOTS_OVERRIDES`:

- thaigov: `www.thaigov.go.th` serves its news list only through `/api/`, which its `robots.txt` disallows. This endpoint is the public read API that the site's own frontend calls. Once per crawl interval (60 minutes), the crawler reads one list page of 20 items and the articles in that list.
- The same host rejects plain HTTP clients, so the crawler fetches it with a Chrome TLS profile (`IMPERSONATE_HOSTS`).

If a site operator asks us to stop, we remove the source. To add an override, write the reason in `ROBOTS_OVERRIDES` and keep the list short.

## Tests and gates

```bash
uv run ruff format .
uv run ruff check .
pyright
uv run python -m pytest
```

Or from the repo root: `mise run format`, `mise run lint`, `mise run typecheck`, `mise run test`.

## Docker

`Dockerfile` has three stages: `base`, `prod` (default `CMD python -m sararath`), and `dev`. Compose uses the `dev` target for the scheduler.
