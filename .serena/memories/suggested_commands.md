# Suggested commands

## Python (run from `api/`)

- Always `uv run python -m sararath <cmd>`; bare `uv run pytest` / `uv run alembic` can fail to spawn here.
- `crawl --source <prd|moac|thaigov|rd>`, `crawl-due [--source X]`, `check [--max-age-hours 26]`, `serve [--host --port]`, `openapi`.
- `backfill-body --source X [--all] [--single-line] [--offset N] [--dry-run]` (prd/moac/thaigov).
- `dedupe-articles`, `repair-links`, `strip-script` (all `--source X --dry-run`).
- `prune-attachments [--source X] [--dry-run]` — drop stored attachments whose URL doesn't return an image; crawls validate new ones first.
- `export-legacy --date YYYY-MM-DD --out data.json`.
- Migrations: `uv run python -m alembic upgrade head` from `api/`.

## Gates (repo root)

- `mise run format` then `mise run lint`, `mise run typecheck`, `mise run test`; `mise run web:build` for SSR.
- API schema: `mise run api:openapi` then `mise run web:api-schema`.

## Local stack

- Dev uses the Neon production DB — there is no local Postgres. `mise run dev` (docker: api :8001, web :3000); `mise run dev:down`, `mise run dev:logs`.
- Exec: `docker compose -f compose.yaml -f compose.dev.yaml exec <svc> ...`.
- Migrations: `mise run migrate` (alembic against DATABASE_URL).
- thaigov scheduler: `mise run scheduler:thaigov` (writes .env DATABASE_URL, i.e. Neon).
- Web env: `cd web && bun run env:check | env:types | env:generate` (@vite-env/cli).
- Git/files behave as standard Linux; no special line-ending setup needed.
