"""Typed face for scalar-fastapi (package types are partially unknown)."""

from fastapi.responses import HTMLResponse

def get_scalar_api_reference(
    *,
    openapi_url: str | None = None,
    title: str | None = None,
    **kwargs: object,
) -> HTMLResponse: ...
