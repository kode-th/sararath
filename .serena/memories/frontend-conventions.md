# Frontend conventions (user-enforced)

## Component props (always enforce)

1. ALWAYS wrap the props type in `Readonly<>`. Never annotate with a bare props type.
   - `function FeedError({ reset }: Readonly<ErrorComponentProps>)`
   - `function Card({ item }: Readonly<{ item: ArticleItem }>)`
2. If the component takes `children`, use `PropsWithChildren`, in this order:
   - children only: `Readonly<PropsWithChildren>`
   - children + more: `Readonly<PropsWithChildren<{ title: string }>>`

## Other rules

1. Tailwind utilities only: no custom CSS classes, no inline `style={{}}` in pages.
2. Imports use the `@/` alias outside the current directory; relative only `./` (never `../`).
3. Filenames: at most ONE dash (`foo-bar.tsx` ok, `foo-bar-baz.tsx` not). Enforced by the shared `filename/single-dash` plugin (`tools/oxlint/single-dash-filename.js`, scoped `**/src/**`).
4. oxlint config is shared: `web/.oxlintrc.json` `extends` the root `.oxlintrc.json`; web-only plugin rules are enabled in the web config.
