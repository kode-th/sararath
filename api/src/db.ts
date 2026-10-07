import { neon } from '@neondatabase/serverless';
import { z } from 'zod';

import type { Env } from './env';
import type { ArticleOut, CategoryOut, HealthOut, RunOut, SourceOut, SuggestOut } from './schemas';

export type Sql = ReturnType<typeof neon>;

export function getSql(env: Env): Sql {
  return neon(env.DATABASE_URL);
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Normalize a Postgres timestamp (Date, `2026-10-07 09:04:00+00`, or ISO) to an ISO-8601 UTC string. */
export function toIso(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'string') return null;
  const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

// Row shapes are validated at runtime so database results are never blindly asserted.
const timestamp = z.unknown();
const dbInt = z.coerce.number().int();

const cursorRowSchema = z.object({
  id: z.string(),
  published_at: z.string().nullable(),
});
export type CursorRow = z.infer<typeof cursorRowSchema>;

const articleRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  body_text: z.string(),
  category: z.string(),
  agency_name: z.string(),
  canonical_url: z.string(),
  language: z.string(),
  published_at: timestamp,
  published_raw: z.string(),
  first_seen_at: timestamp,
  last_seen_at: timestamp,
  slug: z.string(),
  name_th: z.string(),
});
type ArticleRow = z.infer<typeof articleRowSchema>;

const categoryRowSchema = z.object({
  value: z.string(),
  count: dbInt,
});

const suggestionSourceSchema = z.object({
  slug: z.string(),
  name_th: z.string(),
});

const suggestionArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
});

const runRowSchema = z.object({
  started_at: timestamp,
  finished_at: timestamp,
  status: z.string(),
  http_status: z.number().nullable(),
  found_count: dbInt,
  inserted_count: dbInt,
  skipped_count: dbInt,
  error: z.string().nullable(),
  slug: z.string(),
});

const sourceRowSchema = z.object({
  slug: z.string(),
  name_th: z.string(),
  name_en: z.string(),
  collector: z.string(),
  enabled: z.boolean(),
  last_success_at: timestamp,
  last_error: z.string().nullable(),
});

const healthSourceSchema = z.object({
  slug: z.string(),
  last_success_at: timestamp,
  last_error: z.string().nullable(),
});

export interface ArticleFilters {
  source?: string;
  agency?: string;
  category?: string;
  published_from?: string;
  published_to?: string;
  q?: string;
}

export async function resolveCursor(sql: Sql, id: string): Promise<CursorRow | null> {
  const rows = cursorRowSchema.array().parse(
    await sql`
    SELECT id, published_at::text AS published_at
    FROM articles
    WHERE id = ${id}::uuid
  `,
  );
  return rows[0] ?? null;
}

export async function listArticleRows(
  sql: Sql,
  filters: ArticleFilters,
  marker: CursorRow | null,
  limit: number,
): Promise<ArticleRow[]> {
  const { source, agency, category, published_from, published_to, q } = filters;
  const like = q ? `%${q}%` : null;
  const agencyLike = agency ? `%${agency}%` : null;
  return articleRowSchema.array().parse(
    await sql`
    SELECT a.id, a.title, a.summary, a.body_text, a.category, a.agency_name,
           a.canonical_url, a.language, a.published_at, a.published_raw,
           a.first_seen_at, a.last_seen_at, s.slug, s.name_th
    FROM articles a
    JOIN sources s ON a.source_id = s.id
    WHERE TRUE
    ${source ? sql`AND s.slug = ${source}` : sql``}
    ${agencyLike ? sql`AND a.agency_name LIKE ${agencyLike}` : sql``}
    ${category ? sql`AND a.category = ${category}` : sql``}
    ${published_from ? sql`AND a.published_at::date >= ${published_from}::date` : sql``}
    ${published_to ? sql`AND a.published_at::date <= ${published_to}::date` : sql``}
    ${like ? sql`AND (a.title LIKE ${like} OR a.body_text LIKE ${like} OR a.agency_name LIKE ${like})` : sql``}
    ${
      marker
        ? marker.published_at === null
          ? sql`AND a.published_at IS NULL AND a.id < ${marker.id}::uuid`
          : sql`AND (a.published_at < ${marker.published_at}::timestamptz
                     OR a.published_at IS NULL
                     OR (a.published_at = ${marker.published_at}::timestamptz AND a.id < ${marker.id}::uuid))`
        : sql``
    }
    ORDER BY a.published_at DESC NULLS LAST, a.id DESC
    LIMIT ${limit}
  `,
  );
}

export async function getArticleRow(sql: Sql, id: string): Promise<ArticleRow | null> {
  const rows = articleRowSchema.array().parse(
    await sql`
    SELECT a.id, a.title, a.summary, a.body_text, a.category, a.agency_name,
           a.canonical_url, a.language, a.published_at, a.published_raw,
           a.first_seen_at, a.last_seen_at, s.slug, s.name_th
    FROM articles a
    JOIN sources s ON a.source_id = s.id
    WHERE a.id = ${id}::uuid
  `,
  );
  return rows[0] ?? null;
}

export async function attachmentsFor(sql: Sql, ids: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();
  if (ids.length === 0) return grouped;
  const rows = z
    .object({ article_id: z.string(), url: z.string() })
    .array()
    .parse(
      await sql`
      SELECT article_id, url
      FROM attachments
      WHERE article_id = ANY(string_to_array(${ids.join(',')}, ',')::uuid[])
    `,
    );
  for (const row of rows) {
    const urls = grouped.get(row.article_id) ?? [];
    urls.push(row.url);
    grouped.set(row.article_id, urls);
  }
  return grouped;
}

export function toArticle(row: ArticleRow, attachments: string[]): ArticleOut {
  return {
    id: row.id,
    source: { slug: row.slug, name_th: row.name_th },
    title: row.title,
    summary: row.summary,
    body_text: row.body_text,
    category: row.category,
    agency_name: row.agency_name,
    canonical_url: row.canonical_url,
    language: row.language,
    published_at: toIso(row.published_at),
    published_raw: row.published_raw,
    retrieved_at: toIso(row.first_seen_at),
    last_seen_at: toIso(row.last_seen_at),
    attachments,
  };
}

export async function listCategories(
  sql: Sql,
  source: string | undefined,
  q: string | undefined,
): Promise<CategoryOut[]> {
  const like = q ? `%${q}%` : null;
  return categoryRowSchema.array().parse(
    await sql`
    SELECT a.category AS value, count(*)::int AS count
    FROM articles a
    ${source ? sql`JOIN sources s ON a.source_id = s.id` : sql``}
    WHERE a.category <> ''
    ${source ? sql`AND s.slug = ${source}` : sql``}
    ${like ? sql`AND (a.title LIKE ${like} OR a.body_text LIKE ${like} OR a.agency_name LIKE ${like})` : sql``}
    GROUP BY a.category
    ORDER BY count DESC, a.category
  `,
  );
}

export async function suggest(sql: Sql, term: string, limit: number): Promise<SuggestOut> {
  if (term === '') return { sources: [], articles: [] };
  const like = `%${term}%`;
  const sources = suggestionSourceSchema.array().parse(
    await sql`
    SELECT slug, name_th FROM sources WHERE name_th LIKE ${like} ORDER BY slug LIMIT 4
  `,
  );
  const rows = suggestionArticleSchema.array().parse(
    await sql`
    SELECT id, title FROM articles
    WHERE title LIKE ${like}
    ORDER BY published_at DESC NULLS LAST, id DESC
    LIMIT ${limit * 4}
  `,
  );
  const seen = new Set<string>();
  const articles: { id: string; title: string }[] = [];
  for (const row of rows) {
    const key = row.title.replace(/\s+/g, ' ').trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    articles.push({ id: row.id, title: row.title });
    if (articles.length >= limit) break;
  }
  return { sources, articles };
}

export async function listRuns(
  sql: Sql,
  source: string | undefined,
  limit: number,
): Promise<RunOut[]> {
  const rows = runRowSchema.array().parse(
    await sql`
    SELECT r.started_at, r.finished_at, r.status, r.http_status, r.found_count,
           r.inserted_count, r.skipped_count, r.error, s.slug
    FROM collector_runs r
    JOIN sources s ON r.source_id = s.id
    ${source ? sql`WHERE s.slug = ${source}` : sql``}
    ORDER BY r.started_at DESC
    LIMIT ${limit}
  `,
  );
  return rows.map((row) => ({
    source: row.slug,
    started_at: toIso(row.started_at) ?? '',
    finished_at: toIso(row.finished_at),
    status: row.status,
    http_status: row.http_status,
    found_count: row.found_count,
    inserted_count: row.inserted_count,
    skipped_count: row.skipped_count,
    error: row.error,
  }));
}

export async function listSources(sql: Sql): Promise<SourceOut[]> {
  const rows = sourceRowSchema.array().parse(
    await sql`
    SELECT slug, name_th, name_en, collector, enabled, last_success_at, last_error
    FROM sources ORDER BY slug
  `,
  );
  return rows.map((row) => ({
    slug: row.slug,
    name_th: row.name_th,
    name_en: row.name_en,
    collector: row.collector,
    enabled: row.enabled,
    last_success_at: toIso(row.last_success_at),
    last_error: row.last_error,
  }));
}

export async function health(sql: Sql): Promise<HealthOut | null> {
  try {
    await sql`SELECT 1`;
  } catch {
    return null;
  }
  const rows = healthSourceSchema.array().parse(
    await sql`
    SELECT slug, last_success_at, last_error FROM sources ORDER BY slug
  `,
  );
  return {
    db: 'ok',
    sources: rows.map((row) => ({
      slug: row.slug,
      last_success_at: toIso(row.last_success_at),
      last_error: row.last_error,
    })),
  };
}
