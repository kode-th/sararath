# Core — สาระรัฐ / Sararath

Independent index of Thai government news. Not affiliated with any government agency.
Pipeline: collectors → Postgres (Neon) → FastAPI read API → TanStack Start SSR (Cloudflare Workers).

## Source map

- `api/` Python 3.13, uv, src-layout module `sararath` (dist `sararath-api`). See `mem:api/core`.
- `web/` Bun + TanStack Start SSR + React 19 + Tailwind v4 + oxc. Package `@sararath/web`. See `mem:web/core`.
- Root glue: compose[.dev].yaml, render.yaml, mise.toml, lefthook.yml, commitlint.config.mjs, .github/workflows/crawl.yml.
- `api/raw/**` is crawl output (gitignored, not source). `.private/` is a beacon clone (never edit). `.impeccable/`, `DESIGN.md`, `PRODUCT.md`, `raw/` are design context, not tracked source.

## Invariants

- UI copy is Thai; brand is สาระรัฐ (Latin: Sararath). Tagline: ข่าวหน่วยงานรัฐ รวมไว้ที่เดียว.
- Must read as independent, never official; never imitate government branding (no Garuda).
- The API is read-only; the web app never writes to the DB.
- Every article links back to its canonical source URL.
- Search route is `/news` (renamed from `/search`); no redirect for the old path.

## References

- `mem:tech_stack`, `mem:suggested_commands`, `mem:conventions`, `mem:task_completion`
- `mem:domain` (sources, article data model)
- `mem:api/core`, `mem:web/core`
