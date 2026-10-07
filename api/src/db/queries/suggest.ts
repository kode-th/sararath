import { asc, desc, like, sql } from 'drizzle-orm';

import type { SuggestOut } from '../../schemas';
import type { Db } from '../client';
import { articles, sources } from '../schema';

export async function suggest(db: Db, term: string, limit: number): Promise<SuggestOut> {
  if (term === '') return { sources: [], articles: [] };
  const likeTerm = `%${term}%`;

  const sourceRows = await db
    .select({ slug: sources.slug, nameTh: sources.nameTh })
    .from(sources)
    .where(like(sources.nameTh, likeTerm))
    .orderBy(asc(sources.slug))
    .limit(4);
  const rows = await db
    .select({ id: articles.id, title: articles.title })
    .from(articles)
    .where(like(articles.title, likeTerm))
    .orderBy(sql`${articles.publishedAt} desc nulls last`, desc(articles.id))
    .limit(limit * 4);

  const seen = new Set<string>();
  const articlesOut: { id: string; title: string }[] = [];

  for (const row of rows) {
    const key = row.title.replace(/\s+/g, ' ').trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    articlesOut.push({ id: row.id, title: row.title });
    if (articlesOut.length >= limit) break;
  }

  return {
    sources: sourceRows.map((row) => ({
      slug: row.slug,
      name_th: row.nameTh,
    })),
    articles: articlesOut,
  };
}
