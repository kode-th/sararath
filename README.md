# Sararath

Independent index of Thai government news — **Sararath** (สาระรัฐ). Collectors crawl agency sites into Postgres; a FastAPI read API and a TanStack Start frontend serve one feed with search plus agency and category filters, and every item links back to its original source. Sararath is not affiliated with any government agency.

## Architecture

| Part       | Tech                        | Notes                                                                                             |
| ---------- | --------------------------- | ------------------------------------------------------------------------------------------------- |
| Postgres   | Neon free                   | Pooled URL, `?sslmode=require`                                                                    |
| Collectors | Python 3.13, uv             | `rss`, `prd`, `thaigov` collectors in `api/src/sararath/collectors/`                              |
| Scheduler  | GitHub Actions              | Hourly `crawl-due` (`.github/workflows/crawl.yml`): moac/rd/prd only; thaigov 403s datacenter IPs |
| API        | FastAPI, Render free        | Blueprint `render.yaml`, `rootDir: api`, keep-alive via cron-job.org every 10 min                 |
| Frontend   | TanStack Start, Tailwind v4 | `web/`, SSR; deploy to Cloudflare Workers with `wrangler`                                         |

Live API: `https://sararath-apis.fasu.dev` — `/v1/articles`, `/v1/articles/{id}`, `/v1/sources`, `/v1/runs`, `/v1/health`, docs at `/reference` and `/openapi.json`.

## Repository layout

Root holds the glue: `compose.yaml` + `compose.dev.yaml`, `render.yaml`, `mise.toml`, `lefthook.yml`, `commitlint.config.mjs`, `package.json`, `.github/workflows/`.

```txt
api/    src/sararath/{collectors,services,api,models.py,cli.py}
        migrations/ + alembic.ini, sources/sources.yaml, tests/, typings/, Dockerfile
web/    src/routes/            __root.tsx, index.tsx, news.tsx, articles.$id.tsx
        src/components/        layout/{header,footer,not-found}, filters/*, feed/*, news/*, ui/*
        src/lib/               cn.ts, api.ts (typed client), api-schema.d.ts (generated)
        src/utils/             format.ts, feed.ts
        src/constants/         feed.ts
        src/assets/css/        styles.css (entry) -> theme.css, base.css, utilities.css
```

`web/src/lib` is only for library shorthands (`cn`) and the API client; app helpers live in `utils/`, literals in `constants/`. `web/src/routeTree.gen.ts` and `web/src/lib/api-schema.d.ts` are generated.

## Local dev

```bash
cp .env.example .env                 # set POSTGRES_PASSWORD
mise run dev                         # docker: db:5432, api:8001 (hot reload), web:3000
```

Then, in another terminal:

```bash
mise run migrate                     # alembic upgrade head
docker compose -f compose.yaml -f compose.dev.yaml exec api \
  uv run --no-sync python -m sararath seed
docker compose -f compose.yaml -f compose.dev.yaml exec api \
  uv run --no-sync python -m sararath crawl --source rd
```

Open <http://localhost:3000>. `api/src/` edits reload the API; `web/` edits hot-reload the browser. Notes:

- The `scheduler` service is parked behind the `jobs` profile (`docker compose --profile jobs up`); it crawls every due source into the local db. To keep production `thaigov` fresh, run `mise run scheduler:thaigov` on a residential/TH host (writes to the `.env` `DATABASE_URL`).
- `web` runs with `network_mode: host` so SSR and the browser both reach `http://localhost:8001`; the container runs Vite on Node (bun is only used for installs).
- Ports: db `5432`, api `8001`, web `3000`.

## CLI

Run from `api/`, via `uv run python -m sararath <command>` (bare `uv run pytest`/`uv run alembic` can fail to spawn in this environment — always go through `python -m`).

```bash
uv run python -m sararath crawl --source prd      # one source
uv run python -m sararath crawl-due               # all due (respects intervals)
uv run python -m sararath crawl-due --source rd   # restrict to sources
uv run python -m sararath check                   # exit 1 when a source is stale
uv run python -m sararath export-legacy --date 2026-09-20 --out data.json
uv run python -m sararath openapi                 # print the OpenAPI schema
uv run python -m sararath backfill-body --source moac  # refresh bodies (prd, moac)
uv run python -m sararath dedupe-articles --source moac --dry-run  # drop duplicate rows
uv run python -m sararath repair-links --source moac --dry-run    # fix malformed source URLs
uv run python -m sararath strip-script --source prd --dry-run     # drop leaked script text
```

## Sources and cadence

`api/sources/sources.yaml` defines four sources and their `crawl_interval_minutes`: `prd` and `thaigov` 60, `moac` and `rd` 120. `crawl-due` crawls a source only when `now - last_success_at >= interval`, so with the hourly job sources refresh roughly every 1–2 hours. `thaigov` is excluded from the GitHub workflow (its API 403s datacenter IPs); crawl it from residential/TH networks with `mise run scheduler:thaigov`, which runs the hourly loop against the `.env` `DATABASE_URL`.

## Type-safe API client (OpenAPI)

Web types are generated from the API schema; nothing is mirrored by hand.

1. API routes declare Pydantic response models (`api/src/sararath/api/schemas.py` + `response_model=`), so `/openapi.json` has real schemas.
2. `mise run api:openapi` writes the committed `api/openapi.json`.
3. `mise run web:api-schema` runs `openapi-typescript` to generate the committed `web/src/lib/api-schema.d.ts`.
4. `web/src/lib/api.ts` wraps `openapi-fetch`; `ArticleItem`, `ArticlesPage`, `NewsSourceItem` are derived from the schema.

After changing the API, rerun both tasks. The generated schema is excluded from oxfmt and oxlint (but committed).

## Gates

```bash
mise run format          # ruff format + oxfmt
mise run lint            # ruff check + oxlint --type-aware
mise run typecheck       # pyright + tsc
mise run test            # pytest (api)
mise run web:build       # vite build (SSR smoke)
```

- `lefthook` runs format-check/lint/typecheck pre-commit, `pytest` pre-push, and a Conventional Commits check on the message.
- Web lint is `oxlint --type-aware` (needs `oxlint-tsgolint`) and loads local JS plugins in `web/tools/oxlint/` (`jsx/child-element-spacing`, `regex-safety/no-super-linear-backtracking`, `design-system/no-member-expression`).
- Design-system boundaries: `@base-ui/react` imports and JSX member expressions (`<Foo.Bar />`) are restricted to `web/src/components/ui/` (via `no-restricted-imports` and `design-system/no-member-expression`, both lifted by a `src/components/ui/**` override). Wrap primitives there as named, styled components and import those everywhere else.

## Deploy notes

- `DATABASE_URL` must use the `postgresql+psycopg://` scheme. The app uses the pooled host; alembic works on either.
- GitHub secret `DATABASE_URL` feeds the hourly workflow, which runs inside `api/`.
- Render builds from the frozen lock (`uv sync --frozen --no-dev`). The blueprint sets `rootDir: api`, `CORS_ORIGINS=*`, and a `buildFilter` so only `api/**` changes redeploy. Blueprint edits require Dashboard → Blueprint → Apply.
- Frontend: `cd web && bun run deploy` (build + `wrangler deploy`); set `VITE_API_URL` for non-local APIs.
- Full stack on one host: `docker compose up -d` (db + api on :8001 + hourly scheduler).
- `thaigov` is not crawled by Actions; start `mise run scheduler:thaigov` on a residential/TH host to keep it fresh against the Neon `DATABASE_URL`.
