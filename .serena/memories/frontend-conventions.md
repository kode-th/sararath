# Frontend conventions (user-enforced)

## Component props (always enforce)

1. ALWAYS wrap the props type in `Readonly<>`. Never annotate a component with a bare props type.
   - `function FeedError({ reset }: Readonly<ErrorComponentProps>)`
   - `function Card({ item }: Readonly<{ item: ArticleItem }>)`
   - `function AgencyTabs({ sources, active }: Readonly<AgencyTabsProps>)`
2. If the component takes `children`, use `PropsWithChildren`. Two shapes, in this order:
   - children only: `Readonly<PropsWithChildren>`
   - children + more: `Readonly<PropsWithChildren<{ title: string }>>`
   (i.e. `Readonly<` wraps `PropsWithChildren`, and extra props go inside `PropsWithChildren<...>`.)

## Other rules

1. Tailwind utilities only: no custom CSS classes, no inline `style={{}}` in pages. `styles.css` holds the tailwind import, `@theme` tokens, and minimal base rules.
2. Imports use the `@/` alias for anything outside the current directory; relative imports only as `./` (never `../`).
