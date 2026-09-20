from thai_gov_news.cli import build_parser, main


def test_export_legacy_stub(capsys):
    assert main(["export-legacy", "--date", "2026-09-19"]) == 0
    assert "date=2026-09-19" in capsys.readouterr().out


def test_parser_crawl_args():
    args = build_parser().parse_args(["crawl", "--source", "prd"])
    assert args.command == "crawl"
    assert args.source == "prd"


def test_parser_requires_command():
    parser = build_parser()
    try:
        parser.parse_args([])
    except SystemExit as exc:
        assert exc.code == 2
    else:
        raise AssertionError("expected SystemExit")
