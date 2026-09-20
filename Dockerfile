FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:0.12.17 /uv /uvx /bin/

RUN groupadd -r app && useradd -r -g app -m -d /app app

WORKDIR /app
RUN chown app:app /app
USER app

COPY --chown=app:app pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev --no-install-project

COPY --chown=app:app src ./src
COPY --chown=app:app alembic.ini ./alembic.ini
COPY --chown=app:app migrations ./migrations
RUN uv sync --frozen --no-dev

CMD ["uv", "run", "--no-sync", "python", "-m", "thai_gov_news"]
