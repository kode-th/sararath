"""HTML to readable text, keeping paragraph and line breaks."""

from __future__ import annotations

import re

from selectolax.lexbor import LexborHTMLParser

_BR = re.compile(r"<br\s*/?>", re.IGNORECASE)
_PARAGRAPH_END = re.compile(
    r"</(?:p|h[1-6]|section|article|blockquote)>", re.IGNORECASE
)
_LINE_END = re.compile(r"</(?:div|li|tr|ul|ol)>", re.IGNORECASE)


def html_to_text(html: str) -> str:
    """Extract text: `<br>`/block ends become line breaks, `</p>` a blank line."""
    tree = LexborHTMLParser(html or "")
    for node in tree.css("script, style, noscript"):
        node.decompose()
    marked = _PARAGRAPH_END.sub(
        "\n\n", _LINE_END.sub("\n", _BR.sub("\n", tree.html or ""))
    )
    lines = [
        " ".join(line.split()) for line in LexborHTMLParser(marked).text().split("\n")
    ]
    out: list[str] = []
    for line in lines:
        if line:
            out.append(line)
        elif out and out[-1] != "":
            out.append("")
    while out and out[-1] == "":
        out.pop()
    return "\n".join(out)
