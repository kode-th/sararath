# Domain: sources & article model

## Sources (api/sources/sources.yaml) — 4

- `thaigov` รัฐบาลไทย — crawled from a residential/TH host (its API 403s datacenter IPs), 60m.
- `prd` กรมประชาสัมพันธ์ — 60m. `moac` กระทรวงเกษตรและสหกรณ์ — 120m. `rd` กรมสรรพากร — 120m.
- GitHub Actions crawls moac/rd/prd hourly; thaigov runs from the local scheduler.

## Article fields

- title, agency_name, category, published_at + published_raw, retrieved_at (=first_seen_at), last_seen_at, body_text (paragraphs preserved), canonical_url, language, attachments (image URLs).
- The same story from two agencies stays as separate rows and is flagged when repeated in a list.
- rd items link to PDFs and have no images; image availability varies (layout must work without an image).

## API surface

- `/v1/articles` (source, agency, category, published_from, published_to, q, limit, cursor), `/v1/articles/{id}`, `/v1/categories`, `/v1/suggest`, `/v1/sources`, `/v1/runs`, `/v1/health`. OpenAPI at `/openapi.json`, docs at `/reference`.
- Host `https://sararath-apis.fasu.dev` (Render); DB Neon (pooled).
