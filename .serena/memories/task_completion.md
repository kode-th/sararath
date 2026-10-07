# Task completion

- After ANY change run: `mise run format`, then `mise run lint`, `mise run typecheck`, `mise run test`; add `mise run web:build` for SSR-affecting web changes.
- Python invocations go through `uv run python -m sararath ...` (or `uv run python -m pytest`) from `api/`.
- If the API changed: `mise run api:openapi` then `mise run web:api-schema`.
- lefthook: pre-commit = format-check + lint + typecheck; pre-push = pytest; commit-msg = commitlint.
- Do NOT commit or push without explicit user instruction. Ask before destructive DB writes (prod deletes/updates) and before pushing.
- Start editing tasks from a clean git state; keep lint/tests green.
