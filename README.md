# thai-gov-news

Independent index of Thai government news. Collectors → Postgres → FastAPI read API.

## Architecture

| Part      | Provider           | Notes                                                                                            |
| --------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| Postgres  | Neon free          | Pooled URL, `?sslmode=require`                                                                   |
| Scheduler | GitHub Actions     | Hourly `crawl-due` (moac/rd/prd; thaigov 403s datacenter IPs, crawled from residential networks) |
| API       | Render free        | Blueprint in `render.yaml`, keep-alive via cron-job.org every 10 min                             |
| Frontend  | Cloudflare Workers | Separate app, CORS open for GET                                                                  |

Live API: `https://thai-gov-news-apis.onrender.com` (`/v1/articles`, `/v1/sources`, `/v1/health`, `/v1/runs`, `/reference`).

## Local dev

```bash
cp .env.example .env  # fill POSTGRES_PASSWORD (local docker) or DATABASE_URL (Neon)
docker compose up -d db
uv run python -m alembic upgrade head
uv run python -m thai_gov_news seed
uv run python -m thai_gov_news crawl --source rd
uv run python -m thai_gov_news serve --port 8001
```

## CLI

```bash
uv run python -m thai_gov_news crawl --source prd   # one source
uv run python -m thai_gov_news crawl-due            # all due (respects intervals)
uv run python -m thai_gov_news crawl-due --source rd --source prd
uv run python -m thai_gov_news check                # exit 1 when a source is stale
uv run python -m thai_gov_news export-legacy --date 2026-09-20 --out data.json
```

## Deploy notes

- `DATABASE_URL` must use the `postgresql+psycopg://` scheme. App uses the pooled host; alembic works on either.
- GitHub secret `DATABASE_URL` feeds the hourly workflow (`.github/workflows/crawl.yml`).
- Render blueprint sets `CORS_ORIGINS=*` (read-only GET API).
- Full stack also runs on one host: `docker compose up -d` (db + api on :8001 + hourly scheduler).
