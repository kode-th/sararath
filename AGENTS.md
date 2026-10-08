# AGENTS.md

## 01 Purpose

Sararath (สาระรัฐ) is an independent, read-only index of Thai government news: Python crawlers (`crawl/`) write Neon Postgres, a read-only Hono Worker (`api/`) serves it, and a TanStack Start app (`web/`) renders a Thai feed. Change one module without breaking the others; keep the API read-only and the schema single-owner.

## 02 Before You Start (A1)

- Read `docs/PRD.md` (what/why), `docs/ARCHITECTURE.md` (how), `docs/DESIGN_SYSTEM.md` (tokens + components) before editing.
- Read the module README (`crawl/README.md`, `api/README.md`, `web/README.md`) for that module's layout and commands.
- Confirm the task and its scope. If the request is ambiguous or touches structure, ask before editing.

## 03 General Rules (A2)

- Smallest diff that satisfies the task. No scope creep, no drive-by refactors, no reformatting untouched code.
- Match the surrounding style, even when you would do it differently.
- No new dependency without explicit permission. Prefer stdlib and what is installed.
- No unrequested abstractions (no single-implementation interfaces, no config for a fixed value).
- No barrel files, no `export *`; import from the concrete module.
- Script and task names are `foo` or `foo:bar`, never `foo-bar`.
- Language: UI copy is Thai; code, comments, and docs are English. Keep Thai names and commands byte-exact.
- **Never** commit or push without an explicit instruction for that action; finishing work is not permission.
- Ask before destructive DB writes (production deletes/updates) and before any production deploy.
- Commits: Conventional Commits, short one-line subject; allowed types `feat|fix|chore|refactor|docs|style|test|perf` (no `ci`). Branches `feat/name`, `fix/name`.

## 04 Do Not Touch (A3)

Generated, vendored, or sensitive (regenerate or ask instead):

- `api/src/db/generated/schema.ts`: produced by `drizzle-kit pull`; refresh with `mise run api:db:pull`. Never hand-edit.
- `web/src/routeTree.gen.ts`: generated; refresh with `bun run generate:routes` (from `web/`).
- `bun.lock`, `crawl/uv.lock`: lockfiles; nobody edits by hand.
- `crawl/migrations/versions/**`: existing migrations are append-only; add a new revision, never edit a shipped one.
- `crawl/raw/**`, `node_modules/**`, `dist/**`: crawl output and build output.
- `.env`, `api/.dev.vars`: secrets; never read into docs or commit.
- `.serena/`: tool state; read-only, never edit or cite paths from it in docs.

## 05 Coding Guidelines

**Web (`web/`) (A4)**: see `docs/DESIGN_SYSTEM.md` § 05.

- Components live in a subfolder of `web/src/components/`: `ui/`, `layout/`, `filters/`, `feed/`, `news/`.
- `@base-ui/react` imports and JSX member expressions (`<Foo.Bar />`) only inside `components/ui/`; wrap and re-export named components.
- Wrap every props type in `Readonly<…>`; use `PropsWithChildren` when it takes children.
- Imports use `@/`; relative only `./`. Classnames that vary go through `cn()` (`@/lib/cn`); static strings stay plain.
- Tailwind utilities only; no custom classes, no inline `style={{}}` in pages. Use tokens from `theme.css`, never raw color/size values.
- Filenames: at most one dash (`story-row.tsx` ok, `foo-bar-baz.tsx` not).

**API (`api/`) (A5)**: read-only.

- Imports use `@api/*`; relative only `./`. Do **not** use `@/` in `api/` (web owns it).
- Add a resource as a sub-app in `routes/` mounted in `routes/__root.ts`; carry `describeRoute` + `validator` metadata so `/openapi.json` stays correct.
- Keep responses and errors matching the existing shape (`{ items, next_cursor }`, errors `{ detail }`).
- Do not add runtime-only imports that break `web`'s DOM typecheck of `AppType`.

**Crawl (`crawl/`) (A6)**: the only DB writer.

- Run everything as `uv run python -m sararath <cmd>` (bare `uv run pytest`/`alembic` can fail to spawn).
- Schema lives in `models.py` + Alembic; the API only queries it. After a schema change, generate a revision and rerun the API schema pull.
- Preserve body paragraph breaks: collectors emit `\n\n` and `normalize_record` must not collapse them.

## 06 Workflow (A7)

1. **Plan**: state the approach and the files you will touch.
2. **Implement**: the smallest change that satisfies the task.
3. **Verify**: run the checks in § 07 for the modules you touched.
4. **Report**: what changed, what you ran, what is left.

## 07 Test & Verification (A7)

Run from the repo root (mise tasks orchestrate both languages):

```bash
mise run format     # ruff format + oxfmt
mise run lint       # ruff check + oxlint --type-aware
mise run typecheck  # pyright + tsc (api) + tsc (web)
mise run test       # pytest (crawl) + vitest (api)
mise run web:build  # SSR build smoke — add for SSR-affecting web changes
```

Other tasks: `mise run dev` (docker stack: api :8787, web :3000, crawlers), `mise run dev:api` (worker on the host), `mise run migrate` (Alembic upgrade in the dev container), `mise run api:db:pull` (refresh the Drizzle schema).

Module-level: `crawl/`: `uv run python -m sararath <cmd>`, `uv run python -m pytest`; `api/`: `bun run dev`, `bun run test`; `web/`: `bun run dev`, `bun run build`.

A task is done only when `format`, `lint`, `typecheck`, and `test` pass, plus `web:build` for SSR-affecting web changes. lefthook runs format-check, lint, and typecheck pre-commit, and tests pre-push. CI (`.github/workflows/ci.yml`) runs the same on PRs and `main`.

## 08 Delivery Report (A8)

- State what changed and why (file paths).
- State what you ran and its result; never claim success without running the check.
- State what is left, or what needs a decision.
