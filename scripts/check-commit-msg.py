"""Enforce repo commit convention: Conventional Commits + Merge allowance."""

from __future__ import annotations

import re
import sys

TYPES = "feat|fix|chore|refactor|docs|style|test|perf"
PATTERN = re.compile(rf"^({TYPES})(\(.+\))?(!)?: .+|^Merge .+")


def main() -> int:
    path = sys.argv[1]
    with open(path, encoding="utf-8") as f:
        subject = f.readline().strip()
    # Ignore comment lines git appends in some flows; first non-comment wins.
    if not subject or subject.startswith("#"):
        print("commit-msg: empty subject")
        return 1
    if not PATTERN.match(subject):
        print("commit-msg: rejected:", subject)
        print(f"expected: <{TYPES}>[(scope)]: subject")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
