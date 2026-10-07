# Tech stack

## crawl/ (Python)

- Python 3.13, uv (build backend `uv_build`). Import module `sararath`, distribution `sararath-crawl`.
- SQLAlchemy 2 + Alembic, psycopg (pooled Neon). Collectors: httpx, feedparser, selectolax (Lexbor).
- No web framework: the read API moved to the Worker (fastapi/uvicorn/scalar-fastapi removed).

## api/ (Cloudflare Worker)

- Hono (+ `hono/client` for RPC), `hono-openapi` (`describeRoute`/`validator`/`openAPIRouteHandler`), `@scalar/hono-api-reference`, zod v4.
- `@neondatabase/serverless` HTTP driver (no Hyperdrive) + `drizzle-orm/neon-http` query builder. `wrangler` + `@cloudflare/workers-types`. The Drizzle schema is generated from the live DB with `drizzle-kit pull` (`api/src/db/generated/schema.ts`), not hand-written; no `drizzle-kit push`/`migrate` (Alembic owns migrations).
- Exports `AppType`; web imports it via the `@sararath/api` workspace package.

## web/

- Bun (installs/scripts), Vite, TanStack Start + Router + Query, React 19.
- Tailwind v4 (`@theme` tokens in `src/assets/css/theme.css`).
- Base UI (`@base-ui/react`) — imports only in `src/components/ui/`. `@unpic/react` `<Image>`.
- Hono RPC client (`hono/client`); no generated OpenAPI types.
- `@vite-env/core` + zod env (`web/env.ts`, `virtual:env/client`).

## tooling / infra

- bun workspaces (`api`, `web`) at the root; shared oxc config + `tools/oxlint/` JS plugins.
- mise tasks orchestrate gates; lefthook hooks; commitlint Conventional Commits.
- Scheduler: GitHub Actions hourly `crawl-due` (moac/rd/prd); `thaigov` from a residential/TH host.
- DB: Neon (shared by dev and prod; no local Postgres). API host: CF Workers `sararath-apis.fasu.dev`. Web: CF Workers `sararath`.
