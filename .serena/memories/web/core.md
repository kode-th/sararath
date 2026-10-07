# web/ module

## Routes (src/routes/)

- `index.tsx` home feed (lead + "ล่าสุด" + "ข่าวก่อนหน้า", agency tabs, category select, load more).
- `news.tsx` browse/search: `q`, source + category filters; no `q` browses all; "ล้างตัวกรอง" clears.
- `articles.$id.tsx` detail: 12-col grid, article 8 cols, sticky rail "ล่าสุดจาก {agency}"; gallery; back link.
- `__root.tsx` Header/Footer/meta.

## Data & components

- `src/lib/api.ts` builds `hc<AppType>(API_URL)` (Hono RPC) and re-exports response types from `@sararath/api` (`ArticleItem`=ArticleOut, etc.). Errors thrown as `api {status}`; `isMissingArticle` checks 404/422.
- Env: `import { env } from 'virtual:env/client'` (`env.VITE_API_URL`, default `https://sararath-apis.fasu.dev`); schema `web/env.ts`.
- Query options in `src/utils/feed.ts`; hooks in `src/hooks/` (camelCase).
- `components/ui/` = Base UI wrappers; `layout/`, `filters/`, `feed/`, `news/`.
- Removed: openapi-fetch, openapi-typescript, `api-schema.d.ts`, `generate:api`. Types are RPC-only now.

## References

- `mem:frontend-conventions`, `mem:conventions`, `mem:domain`, `mem:api/core`.
