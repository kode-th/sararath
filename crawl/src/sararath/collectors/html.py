"""HTML to readable text, keeping paragraph and line breaks."""

from __future__ import annotations

import re

from selectolax.lexbor import LexborHTMLParser

from sararath.domain.normalize import normalize_body

_BR = re.compile(r"<br\s*/?>", re.IGNORECASE)
_PARAGRAPH_END = re.compile(
    r"</(?:p|h[1-6]|section|article|blockquote)>", re.IGNORECASE
)
_LINE_END = re.compile(r"</(?:div|li|tr|ul|ol)>", re.IGNORECASE)
_ATTRIBUTION = re.compile(r"(?:ที่มา|ข้อมูลจาก)[ \t:]*https?://\S+", re.IGNORECASE)


def strip_trailing_attribution(text: str) -> str:
    """Remove a trailing `ที่มา : <url>` / `ข้อมูลจาก <url>` source credit."""
    stripped = text.strip()
    start = None
    for match in _ATTRIBUTION.finditer(stripped):
        start = match.start()
    return stripped[:start].rstrip() if start is not None else stripped


def html_to_text(html: str) -> str:
    """Extract text: `<br>`/block ends become line breaks, `</p>` a blank line."""
    tree = LexborHTMLParser(html or "")
    for node in tree.css("script, style, noscript"):
        node.decompose()
    marked = _PARAGRAPH_END.sub(
        "\n\n", _LINE_END.sub("\n", _BR.sub("\n", tree.html or ""))
    )
    return normalize_body(LexborHTMLParser(marked).text())
