# Sararath API

Read-only Cloudflare Worker (Hono) serving the Sararath feed. It reads the Neon Postgres database that the Python crawlers in [`../crawl`](../crawl) write to; it never writes.

See the [root README](../README.md) for the full project.

## Endpoints

`/v1/articles`, `/v1/articles/{article_id}`, `/v1/categories`, `/v1/suggest`, `/v1/sources`, `/v1/runs`, `/v1/health`. Interactive docs at `/docs` (Scalar); the OpenAPI document is served live at `/openapi.json` and can be downloaded from Scalar as JSON or YAML.

## Environment

| Var            | Notes                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | Neon pooled URL. Must be `postgresql://…`, **not** `postgresql+psycopg://…` (that scheme is for the Python crawlers). |
| `CORS_ORIGINS` | Comma-separated allowed origins; defaults to `*`.                                                                     |

Local secrets live in `.dev.vars` (gitignored). Production sets them with `wrangler secret put`.

## Dev

```bash
bun install            # from the repo root (workspaces)
bun run api:dev        # or: cd api && bun run dev  → http://localhost:8787
```

The web app's `VITE_API_URL` points here in local dev.

## Database schema

The Worker only reads. Its Drizzle tables live in `src/db/generated/schema.ts`, generated from the live DB (whose schema is owned by Alembic in [`../crawl`](../crawl)):

```bash
bun run db:pull        # or: mise run api:db:pull
```

Never hand-edit the generated file; rerun after a migration.

## OpenAPI

The document is generated at request time from the route `describeRoute`/`validator` metadata and served at `/openapi.json`; `/docs` renders it with Scalar (downloadable as JSON or YAML). Nothing is committed.

The web client does **not** read this document — it imports the worker's `AppType` for Hono RPC types (`@sararath/api`). The document exists for public consumers and `/docs`.

## Deploy

```bash
bun run deploy         # wrangler deploy --minify
```

Requires a Cloudflare login and the `DATABASE_URL` secret set on the worker.
