"""CLI skeleton: crawl + export-legacy. Collectors land in later phases."""

from __future__ import annotations

import argparse


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="thai-gov-news")
    sub = parser.add_subparsers(dest="command", required=True)

    crawl = sub.add_parser("crawl", help="Run collector for a source")
    crawl.add_argument("--source", required=True, help="Source slug")
    crawl.add_argument("--date", default=None, help="Target date YYYY-MM-DD")

    export = sub.add_parser("export-legacy", help="Export daily legacy JSON")
    export.add_argument("--date", required=True, help="Target date YYYY-MM-DD")

    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.command == "crawl":
        print(f"crawl stub: source={args.source} date={args.date}")
        return 0
    if args.command == "export-legacy":
        print(f"export-legacy stub: date={args.date}")
        return 0
    return 2
