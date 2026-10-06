"""moac article page parser: real body + gallery from `news-preview-<id>`."""

from __future__ import annotations

import re
from urllib.parse import urljoin

from selectolax.lexbor import LexborHTMLParser

CONTENT = "div.txt-desc"
GALLERY = ".gallery-item img"

_BR = re.compile(r"<br\s*/?>", re.IGNORECASE)
_BLOCK_END = re.compile(r"</(?:p|div|li|h[1-6]|tr)>", re.IGNORECASE)


def parse_article(html: str, url: str) -> tuple[str, tuple[str, ...]]:
    """Return (body_text, image_urls) from a moac article page."""
    tree = LexborHTMLParser(html)
    return _body_text(tree), _images(tree, url)


def _body_text(tree: LexborHTMLParser) -> str:
    node = tree.css_first(CONTENT)
    if node is None:
        return ""
    # moac wraps the whole article in one <p> using <br> for line/paragraph
    # breaks, so map those to newlines before extracting text.
    inner = _BLOCK_END.sub("\n\n", _BR.sub("\n", node.html or ""))
    return "\n\n".join(_paragraphs(LexborHTMLParser(inner).text()))


def _paragraphs(text: str) -> list[str]:
    out: list[str] = []
    for block in re.split(r"\n\s*\n", text):
        lines = [" ".join(line.split()) for line in block.split("\n")]
        lines = [line for line in lines if line]
        if lines:
            out.append("\n".join(lines))
    return out


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
