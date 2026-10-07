# Domain: sources & article model

## Sources (crawl/sources/sources.yaml) — 4

- `thaigov` รัฐบาลไทย — dedicated collector; residential/TH host (API 403s datacenter IPs), 60m.
- `prd` กรมประชาสัมพันธ์ — dedicated collector, 60m. `moac` กระทรวงเกษตรและสหกรณ์ and `rd` กรมสรรพากร use the generic `rss` collector with fixed `category` from sources.yaml, 120m each.
- GitHub Actions crawls moac/rd/prd hourly; thaigov runs from the local scheduler.

## Article fields

- title, agency_name, category, published_at + published_raw, retrieved_at (=first_seen_at), last_seen_at, body_text (paragraphs preserved), canonical_url, language, attachments (image URLs).
- Also stored: external_id (unique per source), summary, content_hash, raw_path. Unique on (source_id, external_id) and canonical_url.
- Same story from two agencies = separate rows, flagged when repeated in a list.
- rd items link to PDFs and have no images; layout must work without an image.

## API surface (Hono worker)

- `/v1/articles` (source, agency, category, published_from, published_to, q, limit, cursor), `/v1/articles/{id}`, `/v1/categories`, `/v1/suggest`, `/v1/sources`, `/v1/runs`, `/v1/health`. Docs `/docs`, schema `/openapi.json`.
- Host `https://sararath-apis.fasu.dev` (CF Worker); DB Neon (pooled).
