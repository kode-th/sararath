# DESIGN_SYSTEM: สาระรัฐ (Sararath)

The visual and usability contract. Source of truth for every interface decision. Components (`U*`) and tokens (`T*`) are traceable to features in `docs/PRD.md`. Exact values come from `web/src/assets/css/theme.css`, `base.css`, `utilities.css`, and the components under `web/src/components/`.

## 01 Brand Identity

**Creative North Star: "The Summary Sheet" (ชีทสรุป).** Sararath reads like a well-kept study note for today's government news: a cool white sheet, navy ink, hairline-ruled rows, a time margin on the left of every list, and a gold highlighter stroke behind the few lines that matter. Dense on purpose so a phone reader sees many items without a long scroll.

- **Brand direction:** flat, square, printed. Depth comes from rule weight, never shadow. One navy ink for text, rules, and fills; gold only as marker ink. The page never borrows government emblem language.
- **Name / tagline:** สาระรัฐ (Sararath) · ข่าวหน่วยงานรัฐ รวมไว้ที่เดียว.
- **Marks:** `web/public/logo.svg` (square navy Thai letter ส in a gold arc) and `web/public/wordmark.svg` (the word สาระรัฐ). Favicons on a Cool Sheet plate (`favicon.svg`, 16/32px PNG, 180px apple-touch-icon). Never place the monogram on a dark fill without a light plate.
- **Voice: do** "สาระรัฐเป็นแหล่งรวบรวมข่าวจากเว็บไซต์หน่วยงานรัฐ ไม่ใช่เว็บของทางราชการและไม่ได้สังกัดหน่วยงานใด". **Don't** write copy that implies official status or endorsement. (R1.1)
- **Independence statement:** present on every page via the identity strip (`U6`), full text on `sm+`, independence sentence only on phones.

## 02 Colors

Two-ink palette: navy on a faintly blue white sheet, with a gold marker in two strengths. All values are `oklch`. Defined in `web/src/assets/css/theme.css` under `@theme`.

| Token | Name                   | Value                    | Role                                                                      |
| ----- | ---------------------- | ------------------------ | ------------------------------------------------------------------------- |
| T1    | `background`           | `oklch(0.985 0.004 251)` | Cool Sheet: page surface                                                  |
| T2    | `foreground`           | `oklch(0.323 0.074 251)` | Sheet Navy: the single ink (text, 2px rules, fills, focus outline)        |
| T3    | `card`                 | `oklch(0.985 0.004 251)` | Card / field surface (equal to T1)                                        |
| T4    | `card-foreground`      | `oklch(0.323 0.074 251)` | Text on card                                                              |
| T5    | `primary`              | `oklch(0.323 0.074 251)` | Equal to T2                                                               |
| T6    | `primary-foreground`   | `oklch(0.985 0.004 251)` | Text on navy fills                                                        |
| T7    | `secondary`            | `oklch(0.726 0.138 89)`  | Logo Gold: brand parity only; never a surface, never behind text          |
| T8    | `secondary-foreground` | `oklch(0.323 0.074 251)` | Text on Logo Gold (unused)                                                |
| T9    | `muted`                | `oklch(0.955 0.01 251)`  | Tab Grey: resting fill of inactive agency tabs                            |
| T10   | `muted-foreground`     | `oklch(0.48 0.045 251)`  | Pencil Blue: dates, row agency names, captions, placeholders, footer      |
| T11   | `accent`               | `oklch(0.86 0.12 92)`    | Highlighter Gold: marker band, active tab, `::selection`, hover underline |
| T12   | `accent-foreground`    | `oklch(0.55 0.115 83)`   | Gold text use; currently unused — prefer T2 on gold                       |
| T13   | `destructive`          | `oklch(0.55 0.19 27)`    | Correction Red: feed/load-more error text and border only                 |
| T14   | `border`               | `oklch(0.88 0.02 251)`   | Border token                                                              |
| T15   | `input`                | `oklch(0.88 0.02 251)`   | Input border token                                                        |
| T16   | `ring`                 | `oklch(0.323 0.074 251)` | Focus ring (equal to T2)                                                  |

**Named rules.**

- **The Highlighter Rule.** Gold (T11) is marker ink: band, active tab, selection, hover underline. It never fills a button, card, or panel. T7 exists only for brand parity and is not drawn in the UI.
- **The One Ink Rule.** Every text color, rule, and solid fill is T2 or a tint of it. T10 is the same hue at lower contrast; there is no second ink hue.
- Surfaces, borders, and text reference tokens, never literals. `foreground/15` and `accent/40` are the only opacity blends in use.
- **Semantic colors:** error = T13 (destructive). No success/warning/info surfaces exist. "Success" is the absence of the error states; do not invent a green.

## 03 Typography

- **T17 `font-display`:** `'Anuphan', 'IBM Plex Sans Thai Looped', sans-serif` — headings and pressable labels.
- **T18 `font-sans`:** `'IBM Plex Sans Thai Looped', system-ui, sans-serif` — reading, dates, times, meta.
- Numerals: `font-variant-numeric: tabular-nums` on the body, so time margins align column by column.

| Token | Style    | Size / line-height                                                   | Use                                           |
| ----- | -------- | -------------------------------------------------------------------- | --------------------------------------------- |
| T19   | display  | 2rem → 3rem @640px; line-height 1.3 → 1                              | Page heading (one per page)                   |
| T20   | headline | 1.75rem → 2.25rem @640px → 2.125rem @1024px; line-height 1.25 @640px | Lead story title, article title               |
| T21   | title    | 15px / 24px, weight 600, 2-line clamp                                | Story row title (`text-compact`)              |
| T22   | label    | 0.875rem / 1.25rem, weight 600, display face                         | Tabs, buttons, select, actions                |
| T23   | body     | 1rem / 1.75, weight 400, max 62ch, 4-line clamp for lead excerpt     | Reading text (article paragraphs full column) |
| T24   | meta     | 0.75rem / 1rem, weight 400                                           | Identity strip, row agency names, footer      |
| T25   | time     | 0.875rem / 1.25, weight 600 (hour) over 0.75rem date                 | Time margin                                   |

**The Two Voices Rule.** Anuphan (T17) speaks for headings and anything you press; Plex Sans Thai Looped (T18) speaks for reading, dates, times, and meta. A heading in Plex or a paragraph in Anuphan is off-system.
**The Tabular Time Rule.** Numerals are tabular throughout.

## 04 Spacing & Layout

- **Spacing scale (T26):** `xs 4px`, `sm 12px`, `md 16px`, `lg 24px`, `xl 32px`, `2xl 48px`. Section steps in use: 24px (tabs, lead grid), 32px (lead top), 40px (earlier stories), 64px (footer).
- **Radii (T27):** `none 0px`. Square corners everywhere; the only curve is the logo arc.
- **Container (T28):** `@utility container` = centered column, `max-w-6xl` (72rem) on feed/browse pages, `max-w-3xl` reading measure (~48rem), gutters 16px → 32px @640px.
- **Breakpoints:** `sm 640px`, `md 768px`, `lg 1024px`. Layout uses Tailwind `sm:`/`md:`/`lg:` prefixes.
- **Motion (T29):** `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`; `--animate-highlight-sweep: highlight-sweep 900ms var(--ease-out-expo) 200ms both`; hover/transition duration 150ms.

**Layouts.**

- **Home feed (`/`, F1).** From 1024px a 12-column grid, 48px gap: lead 8 cols, "ล่าสุด" list 4 cols; below 1024px one column, 32px gap. Inside the lead, from 768px the image is a left column (0.85fr) across both rows and headline+excerpt sit right (1.15fr); on phones headline first, image after at 2:1. "ข่าวก่อนหน้า" one list on phones, two ruled columns from 768px.
- **Browse / search (`/news`, F2).** Same sheet: agency tabs + category select on one row, results as thumbnail story rows, full-width "โหลดข่าวเพิ่ม".
- **Article detail (`/articles/$id`, F4).** 12-col grid from 1024px: reading column 8 cols (~48rem), "ล่าสุดจาก {agency}" rail 4 cols sticky at `top-24`; below 1024px the rail stacks.
- **Time margin (T30).** Story rows: `3.5rem` time column, flexible title, optional `4.5rem` square thumbnail, 12px gaps, 12px vertical padding.

**Named rules.**

- **The Time Margin Rule.** Every list row opens with a 3.5rem time column (hour over short date); rows without an image keep the margin, only the thumbnail drops. (R3.2)
- **The Ruled Sheet Rule.** Lists are rows divided by hairlines, never a grid of equal cards.
- **The Flat Sheet Rule.** Nothing casts a shadow. Depth = rule weight (2px navy structure) or a navy fill.

## 05 UI Components

Conventions for all components: live in a sub-category folder under `web/src/components/` (`ui/`, `layout/`, `filters/`, `feed/`, `news/`); Base UI imports and JSX member expressions only inside `ui/`; any non-static className goes through `cn()` (`@/lib/cn`, clsx + tailwind-merge); Tailwind utilities only, no custom classes or inline styles in pages.

| ID  | Component                                                                     | Purpose / feature                                                                          | States                                                                                                                           |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| U1  | Button (`ui/button.tsx`)                                                      | Actions; search submit, load-more, gallery arrows, article action (F1, F2, F4)             | default, hover (invert to navy), focus (ring), disabled (60% opacity), loading (label swap)                                      |
| U2  | Agency Tabs (`filters/agency-tabs.tsx`)                                       | Filter by agency (F1, F2)                                                                  | resting (T9 fill, T10 text), hover (T11/40 fill, T2 text), active (T11 fill, T2 text, `aria-current="page"`, 8px vs 6px padding) |
| U3  | Category Select (`ui/select.tsx`, `filters/category-select.tsx`)              | Category facet, counts scoped to `q`+source (F2)                                           | default, hover (T11/40), focus, open, item highlighted (navy fill, light text), disabled                                         |
| U4  | Search Field & Autocomplete (`filters/search-box.tsx`, `ui/autocomplete.tsx`) | Search + agency/title suggestions (F2, F3)                                                 | default, focus (2px ring at 3px offset), loading ("กำลังค้นหา…"), empty ("ไม่พบคำแนะนำ"), highlighted item                          |
| U5  | Card / Container (`ui/card.tsx`)                                              | Rare; the sheet is the container                                                           | default; 1px T2/15 border; error swaps T13                                                                                       |
| U6  | Identity Strip (`layout/header.tsx`)                                          | Independence notice on every page (R1.1)                                                   | static                                                                                                                           |
| U7  | Masthead / Header (`layout/header.tsx`)                                       | Logo, wordmark, tagline, "ข่าวทั้งหมด", search; sticky from 640px                             | static, sticky, hairline bottom border                                                                                           |
| U8  | Footer (`layout/footer.tsx`)                                                  | Logo, tagline, independence sentence, cadence, API link                                    | link hover (Highlighter underline)                                                                                               |
| U9  | Section Tab (`ui/section-tab.tsx`)                                            | Heading of each ruled list; a real `h2` on a 2px navy baseline (F1, F4)                    | static; optional trailing "ดูข่าวทั้งหมด →" link                                                                                     |
| U10 | Story Row (`news/story-row.tsx`)                                              | Unit of the sheet: time margin, 2-line title, agency meta, optional thumbnail (F1, F2, F4) | default, hover (T11/40 fill + T11 title underline), focus-visible (T11/40), image loaded/failed, duplicate (boxed agency chip)   |
| U11 | Lead Story (`news/lead-story.tsx`, `highlight-title.tsx`)                     | Newest item with highlighter band (F1)                                                     | default; band sweep (T29), reduced-motion off; image/no-image; "อ่านรายละเอียด" arrow nudge                                        |
| U12 | Article Gallery (`news/article-gallery.tsx`)                                  | Image carousel, swipe/arrows, counter (F4)                                                 | default, prev/next (only when available), broken image (hidden), 1..N counter                                                    |
| U13 | Article Detail (`routes/articles.$id.tsx`)                                    | Meta line, times, body, "อ่านที่ต้นฉบับ", back link (F4)                                        | default; category link; back returns to previous list when history exists                                                        |
| U14 | Latest Rail (`routes/articles.$id.tsx`)                                       | "ล่าสุดจาก {agency}" ruled list, sticky (F4)                                                 | default, sticky ≥1024px                                                                                                          |
| U15 | Load More (`feed/load-more.tsx`)                                              | Cursor pagination (F1, F2)                                                                 | hidden when no more, default, loading ("กำลังโหลด…", disabled)                                                                    |
| U16 | Feed Error / Error Card (`feed/feed-error.tsx`, `feed/error-card.tsx`)        | Load failure — feed, article, load-more (R3.3)                                             | error (T13 text + border), retry ("ลองใหม่")                                                                                      |
| U17 | Not Found (`layout/not-found.tsx`)                                            | Unknown route / missing article (F4)                                                       | static ("404", "ไม่พบหน้าที่คุณต้องการ")                                                                                               |
| U18 | Marks (`web/public/*.svg`)                                                    | Logo, wordmark, favicons                                                                   | transparent in-page; light plate for favicons                                                                                    |

Component rules: base UI primitives and member expressions stay in `components/ui/`; everything else imports those. Images use `@unpic/react` `<Image>` (no transforms available for Thai government origins, so sizing and loading only).

## 06 States & Feedback

- **Loading:** `FeedFallback` shows a status line ("กำลังโหลดข่าว…", "กำลังค้นหา…") under a Suspense boundary; the search autocomplete shows "กำลังค้นหา…". There are no skeletons or spinners.
- **Empty:** home with no items shows "ยังไม่มีข่าวจากหน่วยงานนี้" + "ดูข่าวจากทุกหน่วยงาน"; browse shows "ไม่พบข่าวที่ตรงกับ …" or "ไม่พบข่าวตามตัวกรองที่เลือก" with "ล้างตัวกรอง".
- **Error:** feed/article failure shows "โหลดข่าวไม่สำเร็จ" with an explanation that the API host may be waking up and a "ลองใหม่" button; load-more failure uses `ErrorCard` with T13. (U16)
- **Not found:** "404" over the highlighter band, "ไม่พบหน้าที่คุณต้องการ", back button. (U17)
- **Toast / notification system:** none. Do not introduce one without a decision.
- **Success:** no success surface; a successful load is just content. Do not add confirmation toasts.

## 07 Icons & Assets

- **Icons:** `lucide-react`, 16px (`size-4`) inline with labels, `aria-hidden="true"` when decorative. Used: search, arrows (left/right/up-right/down), chevron-down, rotate-cw.
- **Images:** `@unpic/react` `<Image>`; `object-cover` inside a 1px T2/15 hairline frame. Row thumbnails 72×72 `layout="fixed"`; gallery 16:9 `layout="constrained"` (1200×675); lead image 2:1 on phones.
- **Broken images:** row thumbnails hide on error (`hideBrokenImage` / state); the layout must hold without them. (R3.2)
- **Logo clear space:** 44px in masthead and footer; keep the arc unobstructed.
- **No illustration or icon set beyond lucide.**

## 08 Responsive & Accessibility

- **Target: WCAG 2.2 AA** (also the DGA Thai government website baseline). (R6.1)
- **Responsive:** one column below 1024px, 12-col feed/article grid at ≥1024px; container gutters 16→32px; agency tabs scroll horizontally, bleeding to the screen edge on phones; the lead image reorders below the headline on phones.
- **Contrast:** body text uses T2 on T1 and T6 on T2; both meet AA. Never set text on T7 (Logo Gold). T13 is used only for error text/border.
- **Focus:** global 2px navy outline (T16) at 3px offset; never removed. The search field shows the ring via `has-[input:focus-visible]`.
- **Keyboard & semantics:** search has an `sr-only` label; agency tabs set `aria-current="page"`; list sections use `aria-labelledby`; the gallery is `aria-roledescription="carousel"` with `aria-label`; images carry alt text.
- **Motion:** every animation is gated behind `prefers-reduced-motion: no-preference`; the gallery sets duration 0 under reduced motion. (R6.1)
- **Color is never the only signal:** the active tab is taller and marked `aria-current`; errors carry text, not just red; repeated stories carry a boxed agency chip.
- **Language:** UI copy is Thai. (R5.2)
