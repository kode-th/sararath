# Thai Gov News Scripts

Repository helper scripts. These are glue for hooks and CI, not part of the `api` or `web` packages.

## check-commit-msg.py

Enforces [Conventional Commits](https://www.conventionalcommits.org/) on the commit subject.

```bash
python3 scripts/check-commit-msg.py .git/COMMIT_EDITMSG
```

It reads the first line of the given file and accepts:

```txt
<type>[(scope)][!]: <subject>
```

where `type` is one of `feat|fix|chore|refactor|docs|style|test|perf`. Merge commits (`Merge …`) are allowed. Anything else exits `1` with the expected format, so the commit is rejected.

It is wired into the `commit-msg` [lefthook](https://lefthook.dev/) hook (`lefthook.yml`), which passes the message file path (`{1}`). `api/pyrightconfig.json` includes this directory, so the script is type-checked by the API's `pyright` gate.
