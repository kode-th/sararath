import { and, desc, eq, inArray, isNull, like, lt, or, sql, type SQL } from 'drizzle-orm';

import type { ArticleOut } from '../../schemas';
import type { Db } from '../client';
import { toIso } from '../row';
import { articles, attachments, sources } from '../schema';

export interface CursorRow {
  id: string;
  publishedAt: Date | null;
}

const articleColumns = {
  id: articles.id,
  title: articles.title,
  summary: articles.summary,
  bodyText: articles.bodyText,
  category: articles.category,
  agencyName: articles.agencyName,
  canonicalUrl: articles.canonicalUrl,
  language: articles.language,
  publishedAt: articles.publishedAt,
  publishedRaw: articles.publishedRaw,
  firstSeenAt: articles.firstSeenAt,
  lastSeenAt: articles.lastSeenAt,
  slug: sources.slug,
  nameTh: sources.nameTh,
};

export interface ArticleFilters {
  source?: string;
  agency?: string;
  category?: string;
  published_from?: string;
  published_to?: string;
  q?: string;
}

export async function resolveCursor(db: Db, id: string): Promise<CursorRow | null> {
  const [row] = await db
    .select({ id: articles.id, publishedAt: articles.publishedAt })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);

  return row ?? null;
}

export async function getArticleRow(db: Db, id: string) {
  const [row] = await db
    .select(articleColumns)
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(eq(articles.id, id))
    .limit(1);

  return row ?? null;
}

export type ArticleRow = NonNullable<Awaited<ReturnType<typeof getArticleRow>>>;

function cursorFilter(marker: CursorRow): SQL | undefined {
  if (marker.publishedAt === null) {
    return and(isNull(articles.publishedAt), lt(articles.id, marker.id));
  }
  return or(
    lt(articles.publishedAt, marker.publishedAt),
    isNull(articles.publishedAt),
    and(eq(articles.publishedAt, marker.publishedAt), lt(articles.id, marker.id)),
  );
}

export async function listArticleRows(
  db: Db,
  filters: ArticleFilters,
  marker: CursorRow | null,
  limit: number,
): Promise<ArticleRow[]> {
  const { source, agency, category, published_from, published_to, q } = filters;

  const likeQ = q ? `%${q}%` : undefined;

  const conditions: (SQL | undefined)[] = [
    source ? eq(sources.slug, source) : undefined,
    agency ? like(articles.agencyName, `%${agency}%`) : undefined,
    category ? eq(articles.category, category) : undefined,
    published_from ? sql`${articles.publishedAt}::date >= ${published_from}::date` : undefined,
    published_to ? sql`${articles.publishedAt}::date <= ${published_to}::date` : undefined,
    likeQ
      ? or(
          like(articles.title, likeQ),
          like(articles.bodyText, likeQ),
          like(articles.agencyName, likeQ),
        )
      : undefined,
    marker ? cursorFilter(marker) : undefined,
  ];

  return db
    .select(articleColumns)
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(and(...conditions))
    .orderBy(sql`${articles.publishedAt} desc nulls last`, desc(articles.id))
    .limit(limit);
}

export async function attachmentsFor(db: Db, ids: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();

  if (ids.length === 0) return grouped;

  const rows = await db
    .select({ articleId: attachments.articleId, url: attachments.url })
    .from(attachments)
    .where(inArray(attachments.articleId, ids));

  for (const row of rows) {
    const urls = grouped.get(row.articleId) ?? [];
    urls.push(row.url);
    grouped.set(row.articleId, urls);
  }

  return grouped;
}

export function toArticle(row: ArticleRow, attachmentUrls: string[]): ArticleOut {
  return {
    id: row.id,
    source: { slug: row.slug, name_th: row.nameTh },
    title: row.title,
    summary: row.summary,
    body_text: row.bodyText,
    category: row.category,
    agency_name: row.agencyName,
    canonical_url: row.canonicalUrl,
    language: row.language,
    published_at: toIso(row.publishedAt),
    published_raw: row.publishedRaw,
    retrieved_at: toIso(row.firstSeenAt),
    last_seen_at: toIso(row.lastSeenAt),
    attachments: attachmentUrls,
  };
}
