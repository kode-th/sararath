import { z } from 'zod';

import type { ArticleOut } from '../schemas';
import type { Sql } from './client';
import { timestamp, toIso } from './row';

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
