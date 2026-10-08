# PRD: สาระรัฐ (Sararath)

Product requirements. Defines what the product is, who it serves, and how success is measured. Everything downstream is built against this. Tagline: **ข่าวหน่วยงานรัฐ รวมไว้ที่เดียว**.

## 01 Product Overview

**สาระรัฐ (Sararath)** is an independent, read-only index of Thai government news. Collectors gather announcements from Thai government agency websites into one Postgres database; a public read API and a Thai-language SSR web app serve them as one searchable feed. Every item names its agency and links back to the original page.

- **Type:** server-rendered web app (TanStack Start on Cloudflare Workers) + public read API (Hono Worker) + scheduled Python crawlers. Not a native mobile app.
- **Hosts:** web `https://sararath.fasu.dev`, API `https://sararath-apis.fasu.dev`.
- **Main goals:** today's official announcements in one place; every item traceable to its source; a feed that stays fresh; an honest statement that the site is not a government site.

## 02 Problem & Opportunity

- **The problem:** Thai government news is spread across many agency websites. A reader who wants today's announcements must visit each site, and each site has its own layout, dates, and image handling.
- **Who has it:** the general public, journalists and content creators, and developers who want the data.
- **Current workaround:** browsing agency sites by hand. The previous approach was a static GitHub Pages site built from a manual Claude/Facebook pipeline with no owned fetch, no database, no API, exact-match dedupe only, no source health, an unbounded client-side fetch of ~90 JSON files, and a Windows-only scheduler. That pipeline produced indirect Facebook content that could not be attributed with confidence.
- **Why now:** the manual pipeline was replaced by owned collectors, a shared database, and a public read API (see `docs/ARCHITECTURE.md`). The product now needs a stated contract for what it is and how success is judged.

## 03 Goals

- **Release goal (current, live):** every enabled source is crawled within its interval and the feed, search, article pages, and read API serve the collected items without error. Measured by `M1`, `M2`, `M4`.
- **Long-term goal (6–12 months):** `TBD` — the repo states no growth target. **Question:** is the goal more sources, more readers, an English UI, or all three? (See `docs/PRD.md` open questions.)
- **Non-goals (decided, from the legacy MVP plan):**
  - No editorial layer: no rewriting, summarizing, opinion ranking, or priority scoring. Ordering is by publish time.
  - No Facebook scraping and no indirect content.
  - No LINE/Telegram push, no auto-translation, no AI summaries in the truth layer.
  - No official affiliation and no imitation of government branding.
  - No search infrastructure beyond Postgres (no Elasticsearch) and no queue/worker platform (no Kafka/Celery/K8s).

## 04 Target Users

Three audiences with equal weight (confirmed 2026-09-24 in the prior product brief):

- **The general public** — wants to know what Thai government agencies announced without visiting each agency site. Most read on phones.
- **Journalists and content creators** — follow government news daily; need speed and a link to the original.
- **Developers** — use the public read API (`/v1/articles`, `/v1/categories`, `/v1/sources`, …).

**Non-users:** people seeking a government service portal (this is not one), readers seeking editorial analysis or opinion, and anyone expecting push notifications or translation.

## 05 Core Features

MVP = shipped and live. Each feature lists its user need and its metric.

| ID  | Feature                                                                                                                                                   | User need                                          | Metric                   | Status |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------ | ------ |
| F1  | Home feed (`/`) — lead story, "ล่าสุด", "ข่าวก่อนหน้า", agency tabs, category select, cursor "โหลดข่าวเพิ่ม"                                                      | See today's news without visiting each agency site | M5 (engagement, TBD), M3 | MVP    |
| F2  | Browse / search (`/news`) — full-text `q` over title, body, agency; source and category filters; "ล้างตัวกรอง"                                              | Find a specific announcement fast                  | M5 (TBD)                 | MVP    |
| F3  | Suggestions — header search autocompletes agency names and article titles via `/v1/suggest`                                                               | Reach the right agency or story with less typing   | M5 (TBD)                 | MVP    |
| F4  | Article detail (`/articles/$id`) — agency, category, publish/retrieved times, image gallery, paragraphs, "อ่านที่ต้นฉบับ", "ล่าสุดจาก {agency}"                  | Verify the story and reach the original in one tap | M3, M5 (TBD)             | MVP    |
| F5  | Public read API — `/v1/articles`, `/v1/articles/{id}`, `/v1/categories`, `/v1/suggest`, `/v1/sources`, `/v1/runs`, `/v1/health`; `/openapi.json`, `/docs` | Build a reader or integration on the data          | M4                       | MVP    |
| F6  | Scheduled multi-source collection — four sources, per-source intervals, `crawl-due`, source health                                                        | The feed is current and complete                   | M1, M2                   | MVP    |

## 06 Scope (v1 / v2 / v3)

- **v1 (live):** the four sources (thaigov, prd, moac, rd), home feed, browse/search, article detail, suggestions, public read API, scheduled collection, independence disclaimer. Done when `M1`, `M2`, `M3`, `M4` hold.
- **v2 (not started):** add agency sources beyond the four; add the missing engagement measurement (`M5`) so reader value can be judged. Trigger: a source is requested or `M5` is required by a decision.
- **v3 (`TBD`):** an English UI is **not decided** (prior brief, "Open"). Do not build it until decided.

## 07 Success Metrics

- **M1 — Crawl freshness.** Every enabled source has a successful run within 2× its `crawl_interval_minutes` (prd/thaigov 60m, moac/rd 120m → within 120m/240m). Measured by `sararath check --max-age-hours` and `GET /v1/health`.
- **M2 — Source coverage.** All 4 enabled sources have a successful run in the last 24h. Measured by `GET /v1/sources` and `GET /v1/runs`.
- **M3 — Source link integrity.** 100% of articles expose a non-empty `canonical_url`. Measured from the database / API (`canonical_url` is a unique, non-null column).
- **M4 — API health.** `GET /v1/health` returns `db: ok` and the Worker responds. Measured in Cloudflare Workers observability (logs + traces).
- **M5 — Reader engagement** (sessions, searches, return visits): `TBD` — **no analytics is wired up.** Do not invent a number. **Question:** which tool (Cloudflare Web Analytics, Plausible, other) and what target?

## 08 Key Requirements

Business rules and constraints. Acceptance criteria are EARS-style: _When `<trigger>`, the system shall `<response>`_.

- **R1.1 Independence notice.** When any page renders, the site shall show the independence statement ("สาระรัฐ…ไม่ใช่เว็บของทางราชการและไม่ได้สังกัดหน่วยงานใด") and shall not imitate official government branding. (F1, F2, F4)
- **R1.2 Source first.** When an item is listed or shown, the UI shall name its agency and link to its `canonical_url`. (F1, F2, F4)
- **R1.3 Time ordering.** When items are listed, the system shall order by `published_at` descending, then id, with null dates last. No editorial ranking. (F1, F2, F5)
- **R2.1 Read-only API.** When the API receives a request, it shall support reads only and shall never write to the database. Only `crawl/` writes. (F5)
- **R3.1 Duplicate handling.** When the same story arrives from two agencies, the system shall keep separate rows and mark the repeat when it appears in a list. (F1, F4, F5)
- **R3.2 Missing images.** When an item has no image, the layout shall still work (the lead collapses its image column; rows drop the thumbnail). (F1, F2, F4)
- **R3.3 Load failure.** When a feed or article request fails, the UI shall show the error state with a retry action. (F1, F2, F4)
- **R4.1 Crawl cadence.** When `crawl-due` runs, a source shall be crawled only if `now - last_success_at >= crawl_interval_minutes`; a failed source shall retry on the next tick. (F6)
- **R4.2 thaigov host constraint.** When crawling `thaigov`, the system shall run from a residential/TH host, because its API returns 403 to datacenter IPs. GitHub Actions shall crawl only moac/rd/prd. (F6)
- **R5.1 Data requirements.** An article shall carry: title, agency name, category, `published_at` plus `published_raw`, retrieved time, body text or summary, `canonical_url`, and zero or more image URLs. `(source_id, external_id)` and `canonical_url` are unique. (F5, F6)
- **R5.2 Language.** When the UI renders, copy shall be Thai. (F1–F4; F5/F6 are non-visual)
- **R6.1 Accessibility.** The UI shall meet WCAG 2.2 AA, gate motion behind `prefers-reduced-motion`, and never use color as the only signal. (F1–F4)

## Open Questions

- **M5 / long-term goal:** which analytics tool, and what reader target? (No number may be invented.)
- **English UI:** still undecided.
- **v3 scope:** not defined.

## Traceability

Feature → requirement → architecture/design/agent links live in `docs/TRACEABILITY.md`, written once all four documents are drafted.
