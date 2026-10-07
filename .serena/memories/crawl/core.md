# crawl/ module (Python writers)

## Layout (crawl/src/sararath/)

- `collectors/`: base, http, html (`html_to_text`), rss (generic), prd, moac, thaigov.
- `pipeline/`: runner, scheduler, ingest, seed (crawl orchestration).
- `domain/`: normalize, thai_date, links, images, dedupe (pure helpers).
- `maintenance/`: backfill, cleanup, export_legacy (CLI repair commands).
- Tests mirror these under `tests/{collectors,pipeline,domain,maintenance}`.
- `models.py`, `database.py`, `cli.py`; `migrations/` + alembic.ini, `sources/sources.yaml`, `tests/`, `typings/`, Dockerfile, pyproject (dist `sararath-crawl`).

## Invariants

- `normalize_record` MUST preserve body paragraph breaks (`normalize_body`); collectors emit `\n\n`; `backfill-body` bypasses normalize.
- moac store identity = (source, title, published_at) with batch collapse (`_collapse_stories`).
- `runner` saves raw HTML/JSON under `raw/` only for prd/thaigov; `_touch_known` overwrites a body only when the new one is longer.
- Schema is owned here; the Hono worker only queries. Migrations run only from `crawl/`.
- No FastAPI anymore: `serve`/`openapi` CLI commands removed; fastapi/scalar-fastapi/uvicorn deps removed.

## References

- `mem:domain`, `mem:task_completion`, `mem:suggested_commands`.
