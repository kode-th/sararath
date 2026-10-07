# api/ module

## Layout (api/src/sararath/)

- `collectors/`: base, http, html (`html_to_text`), rss (generic), prd, moac, thaigov.
- `services/`: runner (collect→ingest→store), scheduler (due/stale), seed, ingest, dedupe, normalize, backfill, cleanup, links, images, thai_date, export_legacy.
- `api/`: app.py (routes), schemas.py (Pydantic models). `models.py`, `cli.py`, `database.py`.
- `migrations/` + alembic.ini, `sources/sources.yaml`, `tests/`, `typings/`, committed `openapi.json`.

## Invariants

- `normalize_record` MUST preserve body paragraph breaks via `normalize_body` (never whitespace-collapse `body_text`). Collectors emit `\n\n`; `backfill-body` bypasses normalize.
- moac store identity = (source, title, published_at) with batch collapse (`_collapse_stories`), so crawls don't duplicate.
- `runner` saves raw HTML/JSON under `raw/` only for prd/thaigov (rss passes none). `_touch_known` overwrites a body only when the new one is longer.
- `/v1/articles`: `q` is LIKE over title/body/agency; `category` is exact match. `/v1/categories` counts are scoped by `source` and `q`.
- Read-only API; collectors are the only writers.

## References

- `mem:domain`, `mem:task_completion`, `mem:suggested_commands`.
