# Tech stack

## api/

- Python 3.13, uv (build backend `uv_build`). Import module `sararath`, distribution `sararath-api`.
- FastAPI + Pydantic response models (drive OpenAPI), SQLAlchemy 2 + Alembic, psycopg (pooled Neon Postgres).
- Collectors: httpx, feedparser, selectolax (Lexbor). Docs UI: scalar-fastapi.
- `openapi.json` is committed and generated (`mise run api:openapi`).

## web/

- Bun (installs/scripts), Vite, TanStack Start + Router + Query, React 19.
- Tailwind v4 (CSS `@theme` tokens in `src/assets/css/theme.css`).
- Base UI (`@base-ui/react`) — imports allowed only in `src/components/ui/`.
- `@unpic/react` `<Image>` (no transforms for gov origins; sizing/loading only).
- API types generated: `openapi-typescript` → `src/lib/api-schema.d.ts` (committed, excluded from oxfmt/oxlint); client `openapi-fetch` in `src/lib/api.ts`.
- Lint/format: oxc (`oxlint --type-aware`, `oxfmt`). Deploy: wrangler → Cloudflare Workers.

## infra

- mise tasks orchestrate gates; lefthook git hooks; commitlint Conventional Commits.
- Scheduler: GitHub Actions hourly `crawl-due` (moac/rd/prd); `thaigov` from a residential/TH host.
- API host: Render (`https://sararath-apis.fasu.dev`). DB: Neon.
