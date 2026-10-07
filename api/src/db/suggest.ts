import { z } from 'zod';

import type { SuggestOut } from '../schemas';
import type { Sql } from './client';

const suggestionSourceSchema = z.object({
  slug: z.string(),
  name_th: z.string(),
});

const suggestionArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
});

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
