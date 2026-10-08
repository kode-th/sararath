# Sararath Web

TanStack Start (React 19, SSR) frontend for Sararath. Bun for installs and scripts, Vite for dev/build, Tailwind v4 for styling, oxc (oxlint/oxfmt) for lint/format. Deploys to Cloudflare Workers.

See the [root README](../README.md) for the full project.

## Layout

```txt
src/routes/
  __root.tsx            document shell, fonts, head; renders Header/Outlet/Footer and the 404
  index.tsx             home feed (lead story, "ล่าสุด", "ข่าวก่อนหน้า", agency tabs, category select)
  news.tsx              browse/search (`q`, source + category filters)
  articles.$id.tsx      article detail (gallery, "ล่าสุดจาก {agency}" rail, not-found + error states)
src/components/
  ui/                   Base UI wrappers (button, card, select, autocomplete, section-tab)
  layout/               header, footer, not-found
  filters/              agency-tabs, category-select, filter-bar, search-box
  feed/                 feed-error, feed-fallback, error-card, load-more
  news/                 lead-story, story-list, story-row, article-gallery, highlight-title
src/lib/                cn.ts (clsx + tailwind-merge), api.ts (Hono RPC client)
src/utils/              feed.ts (react-query options), format.ts
src/constants/          feed.ts
src/hooks/              useFeedPagination, useDebouncedValue, useSplitLines
src/assets/css/         styles.css (entry) -> theme.css, base.css, utilities.css
```

Conventions: component props are wrapped in `Readonly<…>` (use `PropsWithChildren` when the component takes children); imports use the `@/` alias (relative only `./`); Tailwind utilities only, no custom CSS classes or inline styles in pages. `src/routeTree.gen.ts` is generated and excluded from format/lint.

## Scripts

| Script                            | Purpose                            |
| --------------------------------- | ---------------------------------- |
| `bun run dev`                     | Vite dev server on :3000           |
| `bun run build`                   | production SSR + client build      |
| `bun run deploy`                  | `build` then `wrangler deploy`     |
| `bun run generate:routes`         | regenerate `src/routeTree.gen.ts`  |
| `bun run env:check` / `env:types` | validate / emit types for `env.ts` |
| `bun run lint` / `lint:fix`       | oxlint `--type-aware`              |
| `bun run format` / `format:check` | oxfmt                              |
| `bun run typecheck`               | `tsc --noEmit`                     |

## API client

`src/lib/api.ts` builds `hc<AppType>(API_URL)` (Hono RPC) and re-exports response types from `@sararath/api` (`ArticleItem`, `ArticlesPage`, `NewsSourceItem`, …); no generated schema.

The base URL comes from `VITE_API_URL` (schema in `env.ts`), defaulting to the live API (Cloudflare Worker). For local dev point it at `http://localhost:8787`.

## Styling

Tailwind v4 via `@tailwindcss/vite`. Design tokens live in `src/assets/css/theme.css` (`@theme`), base styles in `base.css`, and custom utilities in `utilities.css` (`@utility container` = centered column with responsive gutters; `@utility highlight` = marker stripe). The page shell is a flex column with a sticky header at `sm+` and a 404 that grows to push the footer to the bottom.

## Develop

The root Docker stack brings up the whole app with hot reload:

```bash
mise run dev        # from the repo root; web :3000, api :8787, crawlers
```

It points web at the local worker (`VITE_API_URL=http://localhost:8787`), so the feed needs the api service, which `mise run dev` now starts.

To run web alone on the host:

```bash
bun install
VITE_API_URL=http://localhost:8787 bun run dev    # http://localhost:3000
```

## Build and deploy

```bash
bun run build
bun run deploy        # build + wrangler deploy
```

`wrangler.jsonc` configures the Worker: `nodejs_compat`, the `sararath.fasu.dev` custom domain, and `workers_dev`/`preview_urls` off. `VITE_API_URL` is a build-time variable. Pushes to `main` deploy via Cloudflare Workers Builds (root dir `/`, build `bun run --filter @sararath/web build`, deploy `cd web && npx wrangler deploy`).

To skip rebuilds for unrelated pushes, set **Settings → Build → Build watch paths** with include `web/*, api/src/*, bun.lock, package.json` (no excludes). `api/src/*` is included because `web/tsconfig.json` resolves `@api/*` to `../api/src/*`.
