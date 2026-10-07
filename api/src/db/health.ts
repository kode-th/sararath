import { z } from 'zod';

import type { HealthOut } from '../schemas';
import type { Sql } from './client';
import { timestamp, toIso } from './row';

const healthSourceSchema = z.object({
  slug: z.string(),
  last_success_at: timestamp,
  last_error: z.string().nullable(),
});

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
