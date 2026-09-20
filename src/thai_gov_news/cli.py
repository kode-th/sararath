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
from thai_gov_news.services.scheduler import due_sources, stale_sources
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

    serve = sub.add_parser("serve", help="Run read API")
    serve.add_argument("--host", default="0.0.0.0")
    serve.add_argument("--port", type=int, default=8000)

    sub.add_parser("crawl-due", help="Crawl enabled sources past interval")

    check = sub.add_parser("check", help="Exit 1 when a source is stale")
    check.add_argument("--max-age-hours", type=int, default=26)

    return parser


def _cmd_seed(args: argparse.Namespace) -> int:
    with get_session() as session:
        inserted, updated = seed_sources(session, args.path)
    print(f"seed: inserted={inserted} updated={updated}")
    return 0


def _cmd_crawl(args: argparse.Namespace) -> int:
    with get_session() as session:
        result = run_crawl(session, args.source)
    print(
        f"crawl {result.source}: "
        f"found={result.found} inserted={result.inserted} skipped={result.skipped}"
    )
    return 0


def _cmd_export(args: argparse.Namespace) -> int:
    with get_session() as session:
        payload = export_date(session, args.date)
    out = write_export(payload, args.out)
    if args.manifest:
        update_manifest(args.manifest, Path(args.out).name)
    print(f"export-legacy date={args.date} posts={len(payload['posts'])} out={out}")
    return 0


def _cmd_serve(args: argparse.Namespace) -> int:
    import uvicorn

    uvicorn.run("thai_gov_news.api.app:app", host=args.host, port=args.port)
    return 0


def _crawl_one(slug: str) -> tuple[str, bool]:
    try:
        with get_session() as session:
            result = run_crawl(session, slug)
    except SystemExit as exc:
        if exc.code is None or isinstance(exc.code, int):
            raise
        return f"crawl {slug}: failed: {exc}", True
    return (
        f"crawl {result.source}: found={result.found} "
        f"inserted={result.inserted} skipped={result.skipped}",
        False,
    )


def _cmd_crawl_due() -> int:
    with get_session() as session:
        due = due_sources(session)
    failed = 0
    for source in due:
        message, bad = _crawl_one(source.slug)
        print(message)
        failed += bad
    print(f"crawl-due: due={len(due)} failed={failed}")
    return 1 if failed else 0


def _cmd_check(args: argparse.Namespace) -> int:
    with get_session() as session:
        stale = stale_sources(session, args.max_age_hours)
    for source in stale:
        print(f"stale {source.slug}: last_success_at={source.last_success_at}")
    print(f"check: stale={len(stale)} max_age_hours={args.max_age_hours}")
    return 1 if stale else 0


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.command == "seed":
        return _cmd_seed(args)
    if args.command == "crawl":
        return _cmd_crawl(args)
    if args.command == "export-legacy":
        return _cmd_export(args)
    if args.command == "serve":
        return _cmd_serve(args)
    if args.command == "crawl-due":
        return _cmd_crawl_due()
    if args.command == "check":
        return _cmd_check(args)
    return 2
