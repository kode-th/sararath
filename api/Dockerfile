FROM python:3.13-slim AS base

COPY --from=ghcr.io/astral-sh/uv:0.12.17 /uv /uvx /bin/

RUN groupadd -r app && useradd -r -g app -m -d /app app

WORKDIR /app
RUN chown app:app /app
USER app

COPY --chown=app:app pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev --no-install-project


FROM base AS prod

COPY --chown=app:app src ./src
COPY --chown=app:app alembic.ini ./alembic.ini
COPY --chown=app:app migrations ./migrations
RUN uv sync --frozen --no-dev

CMD ["uv", "run", "--no-sync", "python", "-m", "sararath"]


FROM base AS dev

COPY --chown=app:app src ./src
COPY --chown=app:app alembic.ini ./alembic.ini
COPY --chown=app:app migrations ./migrations
COPY --chown=app:app sources ./sources
RUN uv sync --frozen

CMD ["uv", "run", "--no-sync", "uvicorn", "sararath.api.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "src"]
