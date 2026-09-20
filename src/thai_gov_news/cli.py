"""CLI: seed, crawl, export-legacy."""

from __future__ import annotations

import argparse
from pathlib import Path

from thai_gov_news.database import get_session
from thai_gov_news.services.export_legacy import (
    export_date,
    update_manifest,
    write_export,
)
from thai_gov_news.services.runner import run_crawl
from thai_gov_news.services.seed import DEFAULT_PATH, seed_sources


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="thai-gov-news")
    sub = parser.add_subparsers(dest="command", required=True)

    seed = sub.add_parser("seed", help="Upsert sources from sources.yaml")
    seed.add_argument("--path", default=str(DEFAULT_PATH))

    crawl = sub.add_parser("crawl", help="Run collector for a source")
    crawl.add_argument("--source", required=True, help="Source slug")

    export = sub.add_parser("export-legacy", help="Export daily legacy JSON")
    export.add_argument("--date", required=True, help="Target date YYYY-MM-DD")
    export.add_argument("--out", required=True, help="Output JSON path")
    export.add_argument("--manifest", default=None, help="Manifest path to update")

    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.command == "seed":
        with get_session() as session:
            inserted, updated = seed_sources(session, args.path)
        print(f"seed: inserted={inserted} updated={updated}")
        return 0
    if args.command == "crawl":
        with get_session() as session:
            result = run_crawl(session, args.source)
        print(
            f"crawl {result.source}: "
            f"found={result.found} inserted={result.inserted} skipped={result.skipped}"
        )
        return 0
    if args.command == "export-legacy":
        with get_session() as session:
            payload = export_date(session, args.date)
        out = write_export(payload, args.out)
        if args.manifest:
            update_manifest(args.manifest, Path(args.out).name)
        print(f"export-legacy date={args.date} posts={len(payload['posts'])} out={out}")
        return 0
    return 2
