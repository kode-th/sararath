# Sararath Web

TanStack Start (React 19, SSR) frontend for Sararath. Bun for installs and scripts, Vite for dev/build, Tailwind v4 for styling, oxc (oxlint/oxfmt) for lint/format. Deploys to Cloudflare Workers.

See the [root README](../README.md) for the full project.

## Layout

```txt
src/routes/
  __root.tsx            document shell, fonts, head; renders Header/Outlet/Footer and the 404
  _layout.tsx           pass-through <Outlet />
  _layout/index.tsx     feed (lead story, latest, previous, agency tabs, search)
  _layout/articles.$id.tsx  article detail (not-found + error states)
src/components/
  layout/               header, footer, not-found
  news/                 agency-tabs, lead-story, story-row
  ui/                   button, card, section-tab
src/lib/                cn.ts (clsx + tailwind-merge), api.ts (typed client), api-schema.d.ts (generated)
src/utils/              format.ts, feed.ts (react-query options + helpers)
src/constants/          feed.ts
src/assets/css/         styles.css (entry) -> theme.css, base.css, utilities.css
tools/oxlint/           local oxlint JS plugins
```

Conventions: component props are wrapped in `Readonly<…>`; imports use the `@/` alias (relative only `./`); Tailwind utilities only, no custom CSS classes or inline styles. `routeTree.gen.ts` and `api-schema.d.ts` are generated and excluded from format/lint.

## Scripts

| Script                            | Purpose                                           |
| --------------------------------- | ------------------------------------------------- |
| `bun run dev`                     | Vite dev server on :3000                          |
| `bun run build`                   | production SSR + client build                     |
| `bun run deploy`                  | `build` then `wrangler deploy`                    |
| `bun run generate:api`            | regenerate `src/lib/api-schema.d.ts` from OpenAPI |
| `bun run generate:routes`         | regenerate `src/routeTree.gen.ts`                 |
| `bun run lint` / `lint:fix`       | oxlint `--type-aware`                             |
| `bun run format` / `format:check` | oxfmt                                             |
| `bun run typecheck`               | `tsc --noEmit`                                    |

## API client

Types are generated from the API, not mirrored by hand:

1. The API schema is committed at `../api/openapi.json` (produced by `mise run api:openapi`).
2. `bun run generate:api` turns it into `src/lib/api-schema.d.ts` (`openapi-typescript`).
3. `src/lib/api.ts` wraps `openapi-fetch`; `ArticleItem`, `ArticlesPage`, `NewsSourceItem` are derived from the schema.

The base URL comes from `VITE_API_URL`, defaulting to the live Render API. For local dev point it at `http://localhost:8001`.

## Styling

Tailwind v4 via `@tailwindcss/vite`. Design tokens live in `src/assets/css/theme.css` (`@theme`), base styles in `base.css`, and custom utilities in `utilities.css` (`@utility container` = centered column with responsive gutters; `@utility highlight` = marker stripe). The page shell is a flex column with a sticky header at `sm+` and a 404 that grows to push the footer to the bottom.

## Develop

```bash
bun install
VITE_API_URL=http://localhost:8001 bun run dev    # http://localhost:3000
```

Or use the root Docker stack: `mise run dev`, which runs the web container on `:3000` with hot reload and points it at the API on `:8001`.

## Build and deploy

```bash
bun run build
bun run deploy        # build + wrangler deploy
```

`wrangler.jsonc` configures the Worker (`nodejs_compat`). Public vars go in `wrangler.jsonc` under `vars`; secrets via `wrangler secret put <NAME>`. Set `VITE_API_URL` for non-local environments. Temporary logs while `bun run dev` may show a `replaceRouteChunk` warning from `tsr` — harmless.
