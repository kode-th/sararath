import { and, asc, count, desc, eq, like, ne, or, type SQL } from 'drizzle-orm';

import type { CategoryOut } from '../../schemas';
import type { Db } from '../client';
import { articles, sources } from '../schema';

export async function listCategories(
  db: Db,
  source: string | undefined,
  q: string | undefined,
): Promise<CategoryOut[]> {
  const likeQ = q ? `%${q}%` : undefined;

  const conditions: (SQL | undefined)[] = [
    ne(articles.category, ''),
    source ? eq(sources.slug, source) : undefined,
    likeQ
      ? or(
          like(articles.title, likeQ),
          like(articles.bodyText, likeQ),
          like(articles.agencyName, likeQ),
        )
      : undefined,
  ];

  return db
    .select({ value: articles.category, count: count() })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(and(...conditions))
    .groupBy(articles.category)
    .orderBy(desc(count()), asc(articles.category));
}
