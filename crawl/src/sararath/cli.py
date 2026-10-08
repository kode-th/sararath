"""Command line entry point: seeding, crawling, and maintenance commands."""

from __future__ import annotations

import argparse
from pathlib import Path

from sararath.database import get_session
from sararath.domain.images import prune_attachments
from sararath.domain.links import repair_links
from sararath.maintenance.backfill import backfill_bodies
from sararath.maintenance.cleanup import dedupe_articles, strip_script_text
from sararath.maintenance.export_legacy import (
    export_date,
    update_manifest,
    write_export,
)
from sararath.pipeline.runner import run_crawl
from sararath.pipeline.scheduler import due_sources, stale_sources
from sararath.pipeline.seed import DEFAULT_PATH, seed_sources


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="sararath")
    sub = parser.add_subparsers(dest="command", required=True)

    seed = sub.add_parser("seed", help="Upsert sources from sources.yaml")
    seed.add_argument("--path", default=str(DEFAULT_PATH))

    crawl = sub.add_parser("crawl", help="Run collector for a source")
    crawl.add_argument("--source", required=True, help="Source slug")

    export = sub.add_parser("export-legacy", help="Export daily legacy JSON")
    export.add_argument("--date", required=True, help="Target date YYYY-MM-DD")
    export.add_argument("--out", required=True, help="Output JSON path")
    export.add_argument("--manifest", default=None, help="Manifest path to update")

    crawl_due = sub.add_parser("crawl-due", help="Crawl enabled sources past interval")
    crawl_due.add_argument("--source", action="append", default=None)

    check = sub.add_parser("check", help="Exit 1 when a source is stale")
    check.add_argument("--max-age-hours", type=int, default=26)

    backfill = sub.add_parser(
        "backfill-body", help="Re-fetch article bodies for a source"
    )
    backfill.add_argument("--source", required=True)
    backfill.add_argument("--limit", type=int, default=200)
    backfill.add_argument("--offset", type=int, default=0)
    backfill.add_argument("--dry-run", action="store_true")
    backfill.add_argument("--all", dest="all_items", action="store_true")
    backfill.add_argument(
        "--single-line",
        action="store_true",
        help="Only bodies without paragraph breaks (long single-line)",
    )

    dedupe = sub.add_parser(
        "dedupe-articles", help="Drop duplicates sharing source, title, published_at"
    )
    dedupe.add_argument("--source", default=None)
    dedupe.add_argument("--dry-run", action="store_true")

    repair = sub.add_parser(
        "repair-links", help="Rewrite malformed source URLs to the canonical form"
    )
    repair.add_argument("--source", default=None)
    repair.add_argument("--dry-run", action="store_true")

    strip = sub.add_parser(
        "strip-script", help="Remove leaked script text from stored bodies"
    )
    strip.add_argument("--source", default=None)
    strip.add_argument("--dry-run", action="store_true")

    prune = sub.add_parser(
        "prune-attachments", help="Drop image attachments that no longer resolve"
    )
    prune.add_argument("--source", default=None)
    prune.add_argument("--dry-run", action="store_true")

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


def _cmd_crawl_due(args: argparse.Namespace) -> int:
    with get_session() as session:
        due = due_sources(session)
    if args.source:
        wanted = set(args.source)
        due = [s for s in due if s.slug in wanted]
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


def _cmd_backfill_body(args: argparse.Namespace) -> int:
    with get_session() as session:
        result = backfill_bodies(
            session,
            args.source,
            limit=args.limit,
            offset=args.offset,
            dry_run=args.dry_run,
            reprocess=args.all_items,
            single_line=args.single_line,
        )
    print(
        f"backfill {args.source}: candidates={result.candidates} "
        f"updated={result.updated} failed={result.failed}"
    )
    return 1 if result.failed else 0


def _cmd_dedupe_articles(args: argparse.Namespace) -> int:
    with get_session() as session:
        result = dedupe_articles(session, source=args.source, dry_run=args.dry_run)
    print(
        f"dedupe-articles: groups={result.groups} removed={result.removed} "
        f"dry_run={args.dry_run}"
    )
    return 0


def _cmd_repair_links(args: argparse.Namespace) -> int:
    with get_session() as session:
        result = repair_links(session, source=args.source, dry_run=args.dry_run)
    print(
        f"repair-links: checked={result.checked} updated={result.updated} "
        f"dry_run={args.dry_run}"
    )
    return 0


def _cmd_strip_script(args: argparse.Namespace) -> int:
    with get_session() as session:
        result = strip_script_text(session, source=args.source, dry_run=args.dry_run)
    print(
        f"strip-script: scanned={result.scanned} cleaned={result.cleaned} "
        f"dry_run={args.dry_run}"
    )
    return 0


def _cmd_prune_attachments(args: argparse.Namespace) -> int:
    with get_session() as session:
        result = prune_attachments(session, source=args.source, dry_run=args.dry_run)
    print(
        f"prune-attachments: scanned={result.scanned} removed={result.removed} "
        f"dry_run={args.dry_run}"
    )
    return 0


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.command == "seed":
        return _cmd_seed(args)
    if args.command == "crawl":
        return _cmd_crawl(args)
    if args.command == "export-legacy":
        return _cmd_export(args)
    if args.command == "crawl-due":
        return _cmd_crawl_due(args)
    if args.command == "check":
        return _cmd_check(args)
    if args.command == "backfill-body":
        return _cmd_backfill_body(args)
    if args.command == "dedupe-articles":
        return _cmd_dedupe_articles(args)
    if args.command == "repair-links":
        return _cmd_repair_links(args)
    if args.command == "strip-script":
        return _cmd_strip_script(args)
    if args.command == "prune-attachments":
        return _cmd_prune_attachments(args)
    return 2
