from thai_gov_news.collectors.moac import parse_article

HTML = (
    '<html><head><meta property="og:image" '
    'content="https://m/data/news/l/1.jpg"></head><body>'
    '<div class="txt-desc"><p>one</p><p>two</p>'
    '<div class="gallery-item"><img src="/data/news/l/1.jpg">'
    '<img src="https://m/data/news/l/2.jpg"></div></div></body></html>'
)


def test_parse_article_body_and_images():
    body, images = parse_article(HTML, "https://m/news-preview-9")
    assert body == "one\n\ntwo"
    assert images == ("https://m/data/news/l/1.jpg", "https://m/data/news/l/2.jpg")


def test_parse_article_without_content():
    body, images = parse_article("<html></html>", "https://m/news-preview-9")
    assert body == ""
    assert images == ()


def test_parse_article_keeps_br_paragraphs():
    html = (
        '<html><body><div class="txt-desc"><p>heading<br><br>'
        "para one<br>one more<br><br>para two</p></div></body></html>"
    )
    body, _ = parse_article(html, "https://m/news-preview-9")
    assert body == "heading\n\npara one\none more\n\npara two"
