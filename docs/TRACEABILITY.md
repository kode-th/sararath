# Traceability

Proof the four documents are one system. IDs: `F` feature, `R` requirement, `M` metric (PRD); `C` component, `D` entity, `I` integration (ARCHITECTURE); `U` UI component, `T` token (DESIGN_SYSTEM); `A` agent rule (AGENTS.md). No orphan in either direction.

## Feature matrix

| F                       | Requirements                       | Components | Data / Integrations | UI / Tokens                                                                | Agent rules | Metrics      |
| ----------------------- | ---------------------------------- | ---------- | ------------------- | -------------------------------------------------------------------------- | ----------- | ------------ |
| F1 Home feed            | R1.1, R1.2, R1.3, R3.1, R3.2, R6.1 | C2, C3     | D2, I1              | U2, U4, U6, U7, U9, U10, U11, U15, U16 · T19, T20, T21, T23, T25, T29, T30 | A2, A4, A7  | M3, M5 (TBD) |
| F2 Browse / search      | R1.1, R1.2, R1.3, R3.2, R6.1       | C2, C3     | D2, I1              | U2, U3, U4, U10, U15, U16, U17 · T19, T21, T25, T30                        | A2, A4, A7  | M5 (TBD)     |
| F3 Suggestions          | R6.1                               | C2, C3     | D1, D2, I1          | U4 · T22, T24                                                              | A2, A4, A5  | M5 (TBD)     |
| F4 Article detail       | R1.1, R1.2, R3.1, R3.2, R5.2, R6.1 | C2, C3     | D2, D3, I1          | U12, U13, U14, U17 · T20, T23, T24, T25                                    | A2, A4      | M3, M5 (TBD) |
| F5 Public read API      | R1.3, R2.1, R3.1, R5.1             | C2, C4     | D1–D4, I1, I2, I5   | —                                                                          | A2, A5      | M4           |
| F6 Scheduled collection | R4.1, R4.2, R5.1                   | C1, C4     | D1, D2, D4, I3, I4  | —                                                                          | A6, A8      | M1, M2       |

## Backward trace (every item has a source)

- **Features F1–F6** ← PRD users/needs + the prior legacy MVP plan. All are shipped (v1).
- **Requirements R1–R6** ← each attached to at least one feature above; no free-floating rule.
- **Components C1–C4** ← each named in `docs/ARCHITECTURE.md` § 02–03 and verified against `crawl/`, `api/`, `web/`, Neon.
- **Entities D1–D4** ← `crawl/src/sararath/models.py`.
- **Integrations I1–I5** ← `ARCHITECTURE.md` § 07; each has a failure behaviour.
- **UI U1–U18** ← components under `web/src/components/`, `web/src/routes/`, `web/public/`.
- **Tokens T1–T30** ← `web/src/assets/css/theme.css`, `base.css`, `utilities.css`, and `DESIGN_SYSTEM.md`.
- **Agent rules A1–A8** ← `AGENTS.md`; every rule is project-specific.

## Agent rule index

| A   | AGENTS.md                 | Enforces                                                    |
| --- | ------------------------- | ----------------------------------------------------------- |
| A1  | § 02 Before You Start     | read docs, confirm scope                                    |
| A2  | § 03 General Rules        | small diff, no deps, naming, Thai copy, commits             |
| A3  | § 04 Do Not Touch         | generated/vendored/secret paths                             |
| A4  | § 05 Web                  | component, import, `cn()`, token rules (`DESIGN_SYSTEM.md`) |
| A5  | § 05 API                  | read-only, `@api/*`, describeRoute, response shape          |
| A6  | § 05 Crawl                | `uv run python -m sararath`, schema owner, paragraphs       |
| A7  | § 06–07 Workflow & Verify | plan/implement/verify/report; gate commands                 |
| A8  | § 03, § 08 Git & Delivery | no commit/push without instruction; report evidence         |

## Gaps (accepted)

- **M5 (reader engagement)** has no measurement tool, so F1–F4 have no live engagement number. Recorded as an open question in `docs/PRD.md`; do not invent one.
- **No `U` for F5/F6** — the API and crawlers are non-visual; that is correct, not missing.
- **Long-term goal and English UI** are undecided; PRD records them as open questions rather than inventing scope.
