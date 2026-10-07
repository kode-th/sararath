# Suggested commands

## Python (run from `crawl/`)

- Always `uv run python -m sararath <cmd>`; bare `uv run pytest`/`uv run alembic` can fail to spawn here.
- `crawl --source <prd|moac|thaigov|rd>`, `crawl-due [--source X]`, `check [--max-age-hours 26]`, `openapi` removed.
- `backfill-body --source X [--all] [--single-line] [--offset N] [--dry-run]`.
- `dedupe-articles`, `repair-links`, `strip-script`, `prune-attachments` (all `--source X --dry-run`).
- `export-legacy --date YYYY-MM-DD --out data.json`.
- Migrations: `uv run python -m alembic upgrade head` from `crawl/`.

## Worker (from `api/`)

- `bun run dev` (wrangler dev :8787), `bun run deploy` (wrangler deploy --minify). Secret: `wrangler secret put DATABASE_URL`.

## Gates (repo root)

- `mise run format` (ruff + oxfmt whole repo), `mise run lint` (ruff + root `oxlint --type-aware`), `mise run typecheck` (pyright + tsc api + tsc web), `mise run test`, `mise run web:build`.

## Local stack

- Dev uses the Neon prod DB. `mise run dev:api` (worker :8787), `mise run dev` (docker web :3000 + crawl shell).
- Exec into crawl: `docker compose -f compose.yaml -f compose.dev.yaml exec crawl ...`. Migrations: `mise run migrate`.
- thaigov scheduler: `mise run scheduler:thaigov`.
- `api/.dev.vars` (gitignored) must hold the `postgresql://` form; `.env` (gitignored) holds the `postgresql+psycopg://` form.
- Git/files behave as standard Linux.
