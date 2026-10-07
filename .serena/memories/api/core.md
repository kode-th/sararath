# api/ module (Hono worker on Cloudflare Workers)

## Layout (api/src/)

- `index.ts`: worker entry and app — CORS, mounts `routes` at `/v1`, `/openapi.json` (generated from the mounted `base` so paths keep `/v1`), Scalar `/docs`, `onError`; default-exports `app` + `AppType`; the package `.` export points here.
- `routes/__root.ts`: mounts each sub-app at its resource prefix (`.route('/articles', …)` …); the `/v1` base lives only in `index.ts`.
- `routes/`: one file per resource — `articles` (list + `/:article_id`), `categories`, `suggest`, `runs`, `sources`, `health` — each a sub-app whose routes are relative to its own prefix, with `describeRoute` + `validator` (hono-openapi).
- `db/`: `client.ts` (`getDb` → `drizzle(neon(url))` via `drizzle-orm/neon-http`), `row.ts` (`UUID_RE`, `toIso` — normalizes Postgres text timestamps like `+00`), `queries/` with one module per resource, and `generated/schema.ts` (Drizzle tables produced by `drizzle-kit pull` from the live DB; never hand-edit; regenerate with `bun run db:pull` or `mise run api:db:pull`). No barrel.
- `schemas.ts`: zod response + query schemas (mirror the former Pydantic models).
- `env.ts`: explicit `Env` (DATABASE_URL secret, CORS_ORIGINS var).
- `index.ts`: worker entry, default-exports app.
- `wrangler.jsonc` (name `sararath-api`, main `src/index.ts`, observability logs+traces), `tsconfig.json` (types `@cloudflare/workers-types`).

## Invariants

- Read-only. Endpoints match the former FastAPI exactly (parity-tested vs live oracle): `/v1/articles` (+cursor), `/v1/articles/{id}`, `/v1/categories`, `/v1/suggest`, `/v1/sources`, `/v1/runs`, `/v1/health`; errors are `{detail}` with 422/404/503.
- Public OpenAPI served live at `/openapi.json`; Scalar docs at `/docs`. No committed spec.
- `web` imports `AppType` (RPC): do not add runtime-only imports that break web's DOM tsc.
- hc query values are strings; query types come from the validators.
- Workers best practice: current `compatibility_date`, observability logs+traces, no hardcoded secrets, structured `console.error` in `onError`.

## References

- `mem:domain`, `mem:tech_stack`, `mem:conventions`, `mem:web/core`.
