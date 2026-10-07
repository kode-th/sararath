# web/ module

## Routes (src/routes/)

- `_layout/index.tsx` home feed (lead + "ล่าสุด" + "ข่าวก่อนหน้า", agency tabs, category select, load more).
- `_layout/news.tsx` browse/search (renamed from `search`): search `q`, filter source + category; with no `q` it browses all; "ล้างตัวกรอง" clears q/source/category; category counts scoped to q+source.
- `_layout/articles.$id.tsx` detail: 12-col grid, article 8 cols (reading measure ≈ `max-w-3xl`), sticky rail "ล่าสุดจาก {agency}"; gallery; back link returns to previous list.
- `__root.tsx` Header/Footer/meta (title, description, og, application-name "Sararath", favicons).

## Data & components

- Query options in `src/utils/feed.ts` (`feedQuery`, `sourcesQuery`, `categoriesQuery`, `suggestQuery`); typed client in `src/lib/api.ts`.
- `components/ui/` = Base UI wrappers (button, card, section-tab, select, autocomplete). `components/layout/` = header, footer, search-box, not-found. `components/news/` = lead-story, story-row, agency-tabs, category-select, article-gallery, highlight-title, feed-error.
- Favicons use a light plate (`favicon.svg`) so the navy mark reads on dark browser chrome; in-page `logo.svg` stays transparent.

## References

- `mem:frontend-conventions`, `mem:conventions`, `mem:domain`.
