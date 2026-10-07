# api/ module (Hono worker on Cloudflare Workers)

## Layout (api/src/)

- `app.ts`: Hono app; routes use `describeRoute` + `validator` (hono-openapi); CORS; app is chained so `AppType` captures routes; exports `AppType` and response types.
- `db.ts`: `neon(env.DATABASE_URL)` per request + query fns; rows are zod-parsed (no blind assertions); `toIso` normalizes timestamps; `UUID_RE`.
- `schemas.ts`: zod response + query schemas (mirror the former Pydantic models).
- `env.ts`: explicit `Env` (DATABASE_URL secret, CORS_ORIGINS var).
- `index.ts`: worker entry, default-exports app.
- `wrangler.jsonc` (name `sararath-api`, main `src/index.ts`, observability logs+traces), `tsconfig.json` (types `@cloudflare/workers-types`).

## Invariants

- Read-only. Endpoints match the former FastAPI exactly (parity-tested vs live oracle): `/v1/articles` (+cursor), `/v1/articles/{id}`, `/v1/categories`, `/v1/suggest`, `/v1/sources`, `/v1/runs`, `/v1/health`; errors are `{detail}` with 422/404/503.
- Public OpenAPI served live at `/openapi.json`; Scalar at `/reference`. No committed spec.
- `web` imports `AppType` (RPC): do not add runtime-only imports that break web's DOM tsc.
- hc query values are strings; query types come from the validators.
- Workers best practice: current `compatibility_date`, observability logs+traces, no hardcoded secrets, structured `console.error` in `onError`.

## References

- `mem:domain`, `mem:tech_stack`, `mem:conventions`, `mem:web/core`.
