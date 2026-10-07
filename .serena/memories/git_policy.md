# Git policy (user-enforced)

- NEVER run `git commit` or `git push` (or stage-and-commit) without an EXPLICIT user instruction for that action (the user saying "commit" / "push").
- Finishing work is not permission. Leave changes in the working tree, run the gates, and report; then wait.
- Pushing is always a separate, explicit instruction — even when a commit was just approved.
- Ask before destructive DB writes (prod deletes/updates) and before any production deploy.
- Conventional Commits, SHORT one-line subject; do not rewrite pushed history.
