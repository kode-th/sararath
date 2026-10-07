# Task completion

- After ANY change run from repo root: `mise run format`, then `mise run lint`, `mise run typecheck`, `mise run test`; add `mise run web:build` for SSR-affecting web changes.
- Python invocations go through `uv run python -m sararath ...` (or `uv run python -m pytest`) from `crawl/`.
- No OpenAPI regeneration step anymore; the worker serves it live from route metadata.
- lefthook: pre-commit = format-check + lint + typecheck; pre-push = `mise run test` (pytest + vitest); commit-msg = commitlint.
- Never commit or push without an explicit user instruction — see `mem:git_policy`. Ask before destructive DB writes or production deploys.
- The old FastAPI oracle (Render) is retired. For worker behavior changes, run the local worker (`mise run dev:api`, :8787) and compare against the deployed Worker at `https://sararath-apis.fasu.dev` for regressions; route behavior is also covered by Vitest (`api/tests`).
