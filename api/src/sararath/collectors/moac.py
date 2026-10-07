"""moac article page parser: real body + gallery from `news-preview-<id>`."""

from __future__ import annotations

from urllib.parse import urljoin

from selectolax.lexbor import LexborHTMLParser

from sararath.collectors.html import html_to_text

CONTENT = "div.txt-desc"
GALLERY = ".gallery-item img"


def parse_article(html: str, url: str) -> tuple[str, tuple[str, ...]]:
    """Return (body_text, image_urls) from a moac article page."""
    tree = LexborHTMLParser(html)
    return _body_text(tree), _images(tree, url)


def _body_text(tree: LexborHTMLParser) -> str:
    node = tree.css_first(CONTENT)
    if node is None:
        return ""
    return html_to_text(node.html or "")


def _images(tree: LexborHTMLParser, url: str) -> tuple[str, ...]:
    urls: list[str] = []
    og = tree.css_first('meta[property="og:image"]')
    if og is not None and og.attributes.get("content"):
        urls.append(str(og.attributes["content"]).strip())
    for img in tree.css(GALLERY):
        src = img.attributes.get("src")
        if src:
            urls.append(urljoin(url, str(src)))
    seen: set[str] = set()
    out: list[str] = []
    for image in urls:
        if image and image not in seen:
            seen.add(image)
            out.append(image)
    return tuple(out)
