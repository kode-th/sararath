# Conventions

- Frontend component/import/Tailwind rules: read `mem:frontend-conventions` before editing `web/`.
- Base UI imports and JSX member expressions (`<Foo.Bar/>`) are allowed ONLY in `web/src/components/ui/`; wrap primitives there and export named components. Enforced by oxlint `no-restricted-imports` + `design-system/no-member-expression`.
- Components live in a subfolder of `web/src/components/`: `ui/` (primitives), `layout/` (chrome), `news/` (news parts). Never directly in `components/`.
- `cn()` from `@/lib/cn` only for conditional/merged classNames; static strings stay plain. Tailwind utilities only; no custom classes except `@utility` in utilities.css.
- `web/src/lib` = only `cn` + API client. App helpers → `src/utils/`, literals → `src/constants/`, hook files camelCase in `src/hooks/`.
- Imports: `@/` alias; relative only `./` (never `../`).
- API: routes in `api/src/sararath/api/app.py`; declare Pydantic response models in `schemas.py` so OpenAPI is real; after API changes regenerate `openapi.json` + `api-schema.d.ts`.
- Commits: Conventional Commits, SHORT one-line subject (commitlint via lefthook). Branches `feat/name`, `fix/name`.
- Thai copy: native and plain.
