from typing import Any

class FeedParserDict(dict[str, Any]):
    entries: list[FeedParserDict]

def parse(
    url_file_stream_or_string: str | bytes,
    etag: str | None = ...,
    modified: str | None = ...,
    agent: str | None = ...,
    referrer: str | None = ...,
    handlers: list[Any] | None = ...,
    request_headers: dict[str, str] | None = ...,
    response_headers: dict[str, str] | None = ...,
    resolve_relative_uris: bool | None = ...,
    sanitize_html: bool | None = ...,
) -> FeedParserDict: ...
