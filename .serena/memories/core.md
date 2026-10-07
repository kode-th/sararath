# Core — สาระรัฐ / Sararath

Independent index of Thai government news. Not affiliated with any government agency.
Pipeline: crawl (Python) → Neon Postgres → api (Hono Worker) → web (TanStack Start SSR).

## Source map

- `crawl/` Python 3.13, uv, module `sararath` (dist `sararath-crawl`). Writers: collectors, services, migrations, CLI, scheduler. See `mem:crawl/core`.
- `api/` Hono on Cloudflare Workers, package `@sararath/api`. Read-only API over Neon via `@neondatabase/serverless`; exports `AppType`. See `mem:api/core`.
- `web/` Bun + TanStack Start SSR + React 19 + Tailwind v4, package `@sararath/web`. Consumes the worker via Hono RPC. See `mem:web/core`.
- Root glue: bun workspaces (`api`, `web`), shared oxc config (`.oxlintrc.json`, `.oxfmtrc.json`), `tools/oxlint/` JS plugins, compose[.dev].yaml, mise.toml, lefthook.yml, commitlint.config.mjs, .github/workflows/crawl.yml.
- No `render.yaml` (removed); the read API is the CF Worker.
- `crawl/raw/**` is crawl output (gitignored). `.private/` is a beacon clone (never edit). `.impeccable/`, `DESIGN.md`, `PRODUCT.md` are design context.

## Invariants

- UI copy Thai; brand สาระรัฐ (Latin: Sararath). Tagline: ข่าวหน่วยงานรัฐ รวมไว้ที่เดียว.
- Independent, never official; never imitate gov branding (no Garuda).
- API is read-only; only `crawl/` writes the DB.
- No local Postgres: dev, GitHub Actions, and prod share one Neon `DATABASE_URL`.
- `DATABASE_URL` scheme differs: `crawl/` uses `postgresql+psycopg://`; `api/` uses `postgresql://`.
- Every article links to its canonical source URL.
- Search route is `/news` (renamed from `/search`).

## References

- `mem:tech_stack`, `mem:suggested_commands`, `mem:conventions`, `mem:task_completion`, `mem:git_policy`
- `mem:domain`, `mem:crawl/core`, `mem:api/core`, `mem:web/core`
