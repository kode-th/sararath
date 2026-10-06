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

Docker stack with hot reload (db + api + web), then seed some data:

```bash
cp .env.example .env                 # set POSTGRES_PASSWORD
mise run dev                         # db:5432, api:8001, web:3000
```

Then, in another terminal:

```bash
mise run migrate                     # alembic upgrade head
docker compose -f compose.yaml -f compose.dev.yaml exec api \
  uv run --no-sync python -m thai_gov_news seed
docker compose -f compose.yaml -f compose.dev.yaml exec api \
  uv run --no-sync python -m thai_gov_news crawl --source rd
```

Open <http://localhost:3000>. Edits to `api/src/` reload the API; edits to `web/`
hot-reload the browser.

| Command                                                 | Purpose                               |
| ------------------------------------------------------- | ------------------------------------- |
| `mise run dev`                                          | start stack (foreground)              |
| `mise run dev:down`                                     | stop stack                            |
| `mise run dev:logs`                                     | tail all logs                         |
| `mise run migrate`                                      | apply migrations in the api container |
| `mise run lint` / `format:check` / `typecheck` / `test` | repo gates                            |

Notes:

- Repo layout: `api/` (Python, uv) and `web/` (TypeScript, bun); root holds compose, CI, hooks.
- Ports: db `5432`, api `8001` (host 8000 is often taken), web `3000`.
- `web` runs with `network_mode: host` so SSR and the browser both reach
  `http://localhost:8001`. `@cloudflare/vite-plugin` needs Node, so the web
  container runs Vite on Node with bun only for installs.
- The `scheduler` service is parked behind the `jobs` profile: enable with
  `--profile jobs`, or run jobs with `mise run dev` plus the CLI above.

## CLI

```bash
cd api
uv run python -m thai_gov_news crawl --source prd   # one source
uv run python -m thai_gov_news crawl-due            # all due (respects intervals)
uv run python -m thai_gov_news crawl-due --source rd --source prd
uv run python -m thai_gov_news check                # exit 1 when a source is stale
uv run python -m thai_gov_news export-legacy --date 2026-09-20 --out data.json
```

## Deploy notes

- `DATABASE_URL` must use the `postgresql+psycopg://` scheme. App uses the pooled host; alembic works on either.
- GitHub secret `DATABASE_URL` feeds the hourly workflow (`.github/workflows/crawl.yml`), which runs inside `api/`.
- Render blueprint (`rootDir: api`) sets `CORS_ORIGINS=*` (read-only GET API) and builds from the frozen lock.
- Full stack also runs on one host: `docker compose up -d` (db + api on :8001 + hourly scheduler).
