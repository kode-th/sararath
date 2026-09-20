"""Dedupe by canonical_url -> external_id -> content_hash. stdlib only."""

from __future__ import annotations

import hashlib
from typing import Any

Article = dict[str, Any]


def content_hash(title: str, body: str) -> str:
    payload = "\n".join([(title or "").strip().lower(), (body or "").strip().lower()])
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _norm(value: Any) -> str:
    return str(value or "").strip().lower()


def _digest(article: Article) -> str:
    if article.get("content_hash"):
        return str(article["content_hash"])
    return content_hash(
        str(article.get("title") or ""), str(article.get("body_text") or "")
    )


def dedupe(articles: list[Article]) -> list[Article]:
    seen: set[str] = set()
    out: list[Article] = []
    for article in articles:
        digest = _digest(article)
        keys = {f"hash:{digest}"}
        url = _norm(article.get("canonical_url"))
        if url:
            keys.add(f"url:{url}")
        external = _norm(article.get("external_id"))
        if external:
            keys.add(f"ext:{external}")
        if keys & seen:
            continue
        seen |= keys
        out.append({**article, "content_hash": digest})
    return out
