import { z } from 'zod';

import type { CategoryOut } from '../schemas';
import type { Sql } from './client';
import { dbInt } from './row';

const categoryRowSchema = z.object({
  value: z.string(),
  count: dbInt,
});

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
