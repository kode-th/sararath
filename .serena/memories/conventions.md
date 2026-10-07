# Conventions

- Frontend component/import/Tailwind rules: read `mem:frontend-conventions` before editing `web/`.
- Script names are `foo` or `foo:bar`, never `foo-bar` (package.json + mise tasks).
- oxc is shared: root `.oxlintrc.json` is the baseline; `api/.oxlintrc.json` and `web/.oxlintrc.json` `extends` it. Nested config = nearest file wins; `options.typeAware` only in the root config (we pass `--type-aware` on the CLI instead).
- Custom oxlint JS plugins live in `tools/oxlint/` (shared): `filename/single-dash` (scoped to `**/src/**`), `regex-safety/no-super-linear-backtracking`; web-only `design-system/no-member-expression`, `jsx/child-element-spacing` are enabled only in `web/.oxlintrc.json`.
- `oxfmt` is shared: root `.oxfmtrc.json` with a `web/**` override for Tailwind class sorting. No per-package formatter config.
- Root lint bans nested ternaries (`no-nested-ternary`, Sonar S3358): extract to a statement or helper.
- Components live in a subfolder of `web/src/components/`: `ui/`, `layout/`, `filters/`, `feed/`, `news/`.
- `@base-ui/react` imports and JSX member expressions (`<Foo.Bar/>`) only in `web/src/components/ui/`; wrap primitives there.
- `cn()` from `@/lib/cn` only for conditional/merged classNames. Tailwind utilities only.
- web imports: `@/` alias; relative only `./` (never `../`). `src/lib` = `cn` + API client; helpers `utils/`, literals `constants/`, hooks camelCase in `src/hooks/`.
- api imports: `@api/*` alias (→ `api/src/*`); relative only `./` (same dir). Do NOT use `@/` in api — web owns `@/` and resolves api source through `AppType`, so `@/` collides. `web/tsconfig.json` mirrors `@api/*` → `../api/src/*` for cross-project resolution; `@api/` is in oxfmt `sortImports.internalPattern`.
- Worker DB access uses Drizzle (`api/src/db/`) over the Neon HTTP driver. `api/src/db/generated/schema.ts` is generated with `drizzle-kit pull` (`mise run api:db:pull`) from the DB — never hand-edit; generated files are excluded from oxlint/oxfmt. Alembic (crawl/) stays the single migration owner (no `drizzle-kit push`/`migrate`). Keep responses matching the former FastAPI shape.
- Commits: Conventional Commits, SHORT one-line subject. Branches `feat/name`, `fix/name`. Thai copy: native and plain.
