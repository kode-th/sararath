# Sararath

Independent index of Thai government news — **สาระรัฐ**.

Crawlers collect Thai government agency sites into Postgres; a read-only Cloudflare Worker API and a TanStack Start frontend serve one searchable feed, and every item links back to its original source. Sararath is not affiliated with any government agency.

[👉 sararath.fasu.dev](https://sararath.fasu.dev) · [API docs](https://sararath-apis.fasu.dev/docs) · [OpenAPI](https://sararath-apis.fasu.dev/openapi.json)

## Architecture

```txt
crawl/  Python 3.13 (uv)  →  Neon Postgres  →  api/  Hono Worker  →  web/  TanStack Start SSR
```

- **`crawl/`** — Python collectors; the only database writer. See [`crawl/README.md`](./crawl/README.md).
- **`api/`** — read-only Hono worker over Neon, exports `AppType` for typed RPC. See [`api/README.md`](./api/README.md).
- **`web/`** — TanStack Start SSR on Cloudflare Workers. See [`web/README.md`](./web/README.md).

Root holds the glue: bun workspaces, shared oxc config in `tools/oxlint/`, `compose*.yaml`, `mise.toml`, `lefthook.yml`, and `.github/workflows/`.

## Local dev

Dev uses the **Neon production database** — there is no local Postgres.

```bash
cp .env.example .env                        # DATABASE_URL (postgresql+psycopg://) + LOCAL_UID/LOCAL_GID
cp api/.dev.vars.example api/.dev.vars      # same URL, plain postgresql:// form
mise run dev                                # docker: deps + api :8787 + web :3000 + crawl + scheduler
```

Open <http://localhost:3000>. Migrations and one-off crawls run inside the `crawl` container:

```bash
mise run migrate
docker compose -f compose.yaml -f compose.dev.yaml exec crawl \
  uv run --no-sync python -m sararath crawl --source rd
```

`mise run dev:api` runs the worker on the host instead. `thaigov` is crawled from a residential/TH host via the `thaigov` compose profile (Actions cannot — its API 403s datacenter IPs). Dev and prod share `DATABASE_URL`, so local writes hit production.

## Gates

```bash
mise run format     # ruff format + oxfmt
mise run lint       # ruff check + oxlint --type-aware
mise run typecheck  # pyright + tsc (api) + tsc (web)
mise run test       # pytest + vitest
mise run web:build  # SSR build smoke
```

`lefthook` runs these pre-commit/pre-push with commitlint; CI (`.github/workflows/ci.yml`) runs them on PRs and `main`.

## Deploy

Both Workers deploy from `main` via Cloudflare Workers Builds (root dir `/`). Secrets and build watch-path settings live in [`api/README.md`](./api/README.md) and [`web/README.md`](./web/README.md).
