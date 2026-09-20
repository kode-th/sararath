from thai_gov_news.cli import build_parser


def test_parser_export_legacy_args():
    args = build_parser().parse_args(
        ["export-legacy", "--date", "2026-09-19", "--out", "data/x.json"]
    )
    assert args.command == "export-legacy"
    assert args.date == "2026-09-19"
    assert args.out == "data/x.json"
    assert args.manifest is None


def test_parser_crawl_args():
    args = build_parser().parse_args(["crawl", "--source", "prd"])
    assert args.command == "crawl"
    assert args.source == "prd"


def test_parser_crawl_due_and_check():
    assert build_parser().parse_args(["crawl-due"]).command == "crawl-due"
    args = build_parser().parse_args(["check"])
    assert args.command == "check"
    assert args.max_age_hours == 26


def test_parser_requires_command():
    parser = build_parser()
    try:
        parser.parse_args([])
    except SystemExit as exc:
        assert exc.code == 2
    else:
        raise AssertionError("expected SystemExit")
