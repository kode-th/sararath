# Sararath

Independent index of Thai government news — **Sararath** (สาระรัฐ). Collectors crawl agency sites into Postgres; a Cloudflare Worker read API and a TanStack Start frontend serve one feed with search plus agency and category filters, and every item links back to its original source. Sararath is not affiliated with any government agency.

## Architecture

| Part      | Tech                        | Notes                                                                                     |
| --------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| Postgres  | Neon free                   | Pooled URL. Crawlers use `postgresql+psycopg://`, the worker uses `postgresql://`         |
| Crawlers  | Python 3.13, uv             | `crawl/` — `rss`, `prd`, `thaigov` collectors, migrations, CLI                            |
| Scheduler | GitHub Actions              | Hourly `crawl-due` (`.github/workflows/crawl.yml`): moac/rd/prd only; thaigov 403s DC IPs |
| Read API  | Hono on Cloudflare Workers  | `api/` — Neon serverless driver, OpenAPI + Scalar at `/reference`                         |
| Frontend  | TanStack Start, Tailwind v4 | `web/`, SSR, deploys to Cloudflare Workers, talks to the worker via Hono RPC              |

Live API: `https://sararath-apis.fasu.dev` — `/v1/articles`, `/v1/articles/{id}`, `/v1/categories`, `/v1/suggest`, `/v1/sources`, `/v1/runs`, `/v1/health`, docs at `/reference`, schema at `/openapi.json`.

## Repository layout

Root holds the glue: bun workspaces (`api`, `web`), shared oxc config (`.oxlintrc.json`, `.oxfmtrc.json`, `tools/oxlint/`), `compose.yaml` + `compose.dev.yaml`, `mise.toml`, `lefthook.yml`, `commitlint.config.mjs`, and `.github/workflows/`.

```txt
crawl/  src/sararath/{collectors,services,models.py,cli.py}
        migrations/ + alembic.ini, sources/sources.yaml, tests/, typings/, Dockerfile
api/    src/{app.ts,db.ts,schemas.ts,env.ts,index.ts}   Hono worker (exports AppType)
        wrangler.jsonc, tsconfig.json
web/    src/routes/            __root.tsx, index.tsx, news.tsx, articles.$id.tsx
        src/components/        layout/*, filters/*, feed/*, news/*, ui/*
        src/lib/               cn.ts, api.ts (Hono RPC client)
        src/utils/, src/constants/, src/hooks/, src/assets/css/
```

`web/src/lib` is only for library shorthands (`cn`) and the API client; app helpers live in `utils/`, literals in `constants/`. `web/src/routeTree.gen.ts` is generated.

## Local dev

Dev uses the **Neon production database** — there is no local Postgres.

```bash
cp .env.example .env                              # Python crawlers: postgresql+psycopg://…
cp api/.dev.vars.example api/.dev.vars            # Worker: same URL, postgresql://… form
mise run dev:api                                  # Hono worker on http://localhost:8787
mise run dev                                      # docker: web on :3000 (VITE_API_URL → :8787)
```

Then, in another terminal:

```bash
mise run migrate                                  # alembic upgrade head
docker compose -f compose.yaml -f compose.dev.yaml exec crawl \
  uv run --no-sync python -m sararath seed
docker compose -f compose.yaml -f compose.dev.yaml exec crawl \
  uv run --no-sync python -m sararath crawl --source rd
```

Open <http://localhost:3000>. Notes:

- Dev, GitHub Actions, and production all use the same Neon `DATABASE_URL`, so local crawls/backfills/migrations write to **production** — treat them accordingly.
- The `scheduler` service is parked behind the `jobs` profile; it crawls every due source into `DATABASE_URL`. To keep `thaigov` fresh, run `mise run scheduler:thaigov` on a residential/TH host.
- `web` runs with `network_mode: host` so SSR and the browser both reach the worker on `localhost:8787`; the container runs Vite on Node (bun is only used for installs).
- Ports: worker `8787`, web `3000`.

## CLI

Run from `crawl/`, via `uv run python -m sararath <command>` (bare `uv run pytest`/`uv run alembic` can fail to spawn in this environment — always go through `python -m`).

```bash
uv run python -m sararath crawl --source prd      # one source
uv run python -m sararath crawl-due               # all due (respects intervals)
uv run python -m sararath crawl-due --source rd   # restrict to sources
uv run python -m sararath check                   # exit 1 when a source is stale
uv run python -m sararath export-legacy --date 2026-09-20 --out data.json
uv run python -m sararath backfill-body --source moac  # refresh bodies (prd, moac); --single-line for long single-line only
uv run python -m sararath dedupe-articles --source moac --dry-run  # drop duplicate rows
uv run python -m sararath repair-links --source moac --dry-run    # fix malformed source URLs
uv run python -m sararath strip-script --source prd --dry-run     # drop leaked script text
uv run python -m sararath prune-attachments --source prd --dry-run # drop image URLs that don't resolve
```

## Sources and cadence

`crawl/sources/sources.yaml` defines four sources and their `crawl_interval_minutes`: `prd` and `thaigov` 60, `moac` and `rd` 120. `crawl-due` crawls a source only when `now - last_success_at >= interval`, so with the hourly job sources refresh roughly every 1–2 hours. `thaigov` is excluded from the GitHub workflow (its API 403s datacenter IPs); crawl it from residential/TH networks with `mise run scheduler:thaigov`.

## Types and API docs

Web is typed end-to-end from the worker via **Hono RPC**: `api/src/app.ts` exports `AppType`, `web/src/lib/api.ts` builds an `hc<AppType>` client, and response types are the worker's zod schemas (re-exported from `@sararath/api`). Nothing is mirrored by hand and no generated schema is committed.

The public contract is served live: `/openapi.json` (generated from the route `describeRoute`/`validator` metadata) and `/reference` (Scalar, downloadable as JSON/YAML).

## Gates

```bash
mise run format          # ruff format + oxfmt (whole repo)
mise run lint            # ruff check + oxlint --type-aware (root config, nested per package)
mise run typecheck       # pyright + tsc (api) + tsc (web)
mise run test            # pytest (crawl)
mise run web:build       # vite build (SSR smoke)
```

- `lefthook` runs format-check/lint/typecheck pre-commit, `pytest` pre-push, and a Conventional Commits check on the message.
- One shared oxlint config at the root (`.oxlintrc.json`) with per-package `extends`; custom JS plugins live in `tools/oxlint/` (`filename/single-dash`, `regex-safety/no-super-linear-backtracking`, plus web-only `design-system/no-member-expression`, `jsx/child-element-spacing`).
- Design-system boundaries: `@base-ui/react` imports and JSX member expressions (`<Foo.Bar />`) are restricted to `web/src/components/ui/`.

## Deploy notes

- `DATABASE_URL` scheme: crawlers need `postgresql+psycopg://`; the worker needs `postgresql://`. Rotating the Neon password means updating it in the GitHub secret `DATABASE_URL`, the Worker secret `DATABASE_URL`, local `.env`, and `api/.dev.vars`.
- Crawlers: GitHub Actions secret `DATABASE_URL` feeds the hourly `crawl/` workflow.
- Worker (`sararath-api`): `cd api && bun run deploy` (`wrangler deploy --minify`); set the secret with `wrangler secret put DATABASE_URL`. Custom domain `sararath-apis.fasu.dev`.
- Web (`sararath`): `cd web && bun run deploy`; `VITE_API_URL` is optional — the client defaults to `https://sararath-apis.fasu.dev`.
- `thaigov` is not crawled by Actions; start `mise run scheduler:thaigov` on a residential/TH host.
