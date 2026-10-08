# Traceability

Proof the four documents are one system. IDs: `F` feature, `R` requirement, `M` metric (PRD); `C` component, `D` entity, `I` integration (ARCHITECTURE); `U` UI component, `T` token (DESIGN_SYSTEM); `A` agent rule (AGENTS.md). Every ID is either **feature-scoped** (matrix below) or **global** (foundation list); no orphan in either direction.

## Feature matrix

| F                       | Requirements                                   | Components | Data / Integrations | UI / Tokens                                                                    | Agent rules | Metrics      |
| ----------------------- | ---------------------------------------------- | ---------- | ------------------- | ------------------------------------------------------------------------------ | ----------- | ------------ |
| F1 Home feed            | R1.1, R1.2, R1.3, R3.1, R3.2, R3.3, R5.2, R6.1 | C2, C3     | D2, I1, I2          | U1, U2, U4, U6, U7, U9, U10, U11, U15, U16 · T19, T20, T21, T23, T25, T29, T30 | A4          | M3, M5 (TBD) |
| F2 Browse / search      | R1.1, R1.2, R1.3, R3.2, R3.3, R5.2, R6.1       | C2, C3     | D2, I1, I2          | U1, U2, U3, U4, U6, U7, U10, U15, U16, U17 · T19, T21, T25, T30                | A4          | M5 (TBD)     |
| F3 Suggestions          | R5.2, R6.1                                     | C2, C3     | D1, D2, I1, I2      | U4 · T22, T24                                                                  | A4, A5      | M5 (TBD)     |
| F4 Article detail       | R1.1, R1.2, R3.1, R3.2, R3.3, R5.2, R6.1       | C2, C3     | D2, D3, I1, I2      | U1, U6, U7, U9, U10, U12, U13, U14, U16, U17 · T20, T23, T24, T25              | A4          | M3, M5 (TBD) |
| F5 Public read API      | R1.3, R2.1, R3.1, R5.1                         | C2, C4     | D1–D4, I1, I2, I5   | —                                                                              | A5          | M4           |
| F6 Scheduled collection | R4.1, R4.2, R5.1                               | C1, C4     | D1, D2, D4, I3, I4  | —                                                                              | A6          | M1, M2       |

## Global foundation (applies to every feature)

These IDs are not feature-scoped; they are the shared base the matrix rows build on.

- **Components:** C1–C4 are the whole system (C1/C4 in F6, C2/C3 in F1–F4). No component without a feature.
- **Entities:** D1–D4 are the schema; each appears in at least one matrix row.
- **Integrations:** I1–I5; each appears in at least one matrix row, each has a failure behaviour.
- **UI:** U5 Card (rare container), U8 Footer, U18 Marks are page chrome/containers on every route, not tied to one feature. U1–U4, U6, U7, U9–U17 are in the matrix.
- **Tokens:** T1–T18 (palette, fonts) and T26–T28 (spacing, radii, container) are global foundations; T19–T25 and T29–T30 are the feature-scoped ones listed above. All defined in `DESIGN_SYSTEM.md` § 02–04.
- **Agent rules:** A1 (read docs first), A2 (general rules), A3 (do-not-touch), A7 (workflow/verify), A8 (git/delivery) apply to every change, so they are not repeated per feature.

## Architecture decision links

Every ADR in `ARCHITECTURE.md` traces to a requirement, integration, or rule.

| ADR   | Decision                              | Traces to             |
| ----- | ------------------------------------- | --------------------- |
| ADR-1 | Crawlers own schema; API read-only    | R2.1, C1, C2, A5, A6  |
| ADR-2 | One Neon database, shared             | I1, A2 (DB-write ask) |
| ADR-3 | Drizzle schema from `db:pull`         | A3, A6                |
| ADR-4 | Hono RPC (`AppType`) over OpenAPI     | F5, A5                |
| ADR-5 | thaigov crawled from residential host | R4.2, I4, F6          |
| ADR-6 | No authentication                     | R2.1, F5              |

## Agent rule index

Anchors `(A1)`…`(A8)` are in the `AGENTS.md` headings.

| A   | AGENTS.md                  | Enforces                                                    |
| --- | -------------------------- | ----------------------------------------------------------- |
| A1  | § 02 Before You Start      | read docs, confirm scope                                    |
| A2  | § 03 General Rules         | small diff, no deps, naming, Thai copy, commits             |
| A3  | § 04 Do Not Touch          | generated/vendored/secret paths                             |
| A4  | § 05 Web                   | component, import, `cn()`, token rules (`DESIGN_SYSTEM.md`) |
| A5  | § 05 API                   | read-only, `@api/*`, describeRoute, response shape          |
| A6  | § 05 Crawl                 | `uv run python -m sararath`, schema owner, paragraphs       |
| A7  | § 06–07 Workflow & Verify  | plan/implement/verify/report; gate commands                 |
| A8  | § 08 (+ git rules in § 03) | report evidence; no commit/push without instruction         |

## Backward trace (every item has a source)

- **Features F1–F6** ← PRD users/needs + the prior legacy MVP plan. All are shipped (v1).
- **Requirements R1–R6** ← each attached to at least one feature above; no free-floating rule.
- **Components C1–C4** ← named in `ARCHITECTURE.md` § 02–03 and verified against `crawl/`, `api/`, `web/`, Neon.
- **Entities D1–D4** ← `crawl/src/sararath/models.py`.
- **Integrations I1–I5** ← `ARCHITECTURE.md` § 07; each has a failure behaviour.
- **ADR-1–6** ← `ARCHITECTURE.md` § Architecture Decisions; each links forward above.
- **UI U1–U18** ← components under `web/src/components/`, `web/src/routes/`, `web/public/`.
- **Tokens T1–T30** ← `web/src/assets/css/theme.css`, `base.css`, `utilities.css`, and `DESIGN_SYSTEM.md`.
- **Agent rules A1–A8** ← `AGENTS.md`; every rule is project-specific.

## Gaps (accepted)

- **M5 (reader engagement)** has no measurement tool, so F1–F4 have no live engagement number. Recorded as an open question in `docs/PRD.md`; do not invent one.
- **No `U` for F5/F6**: the API and crawlers are non-visual; that is correct, not missing.
- **Long-term goal and English UI** are undecided; PRD records them as open questions rather than inventing scope.
