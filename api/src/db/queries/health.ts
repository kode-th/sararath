import { asc, sql } from 'drizzle-orm';

import type { HealthOut } from '../../schemas';
import type { Db } from '../client';
import { toIso } from '../row';
import { sources } from '../schema';

export async function health(db: Db): Promise<HealthOut | null> {
  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    return null;
  }

  const rows = await db
    .select({
      slug: sources.slug,
      lastSuccessAt: sources.lastSuccessAt,
      lastError: sources.lastError,
    })
    .from(sources)
    .orderBy(asc(sources.slug));

  return {
    db: 'ok',
    sources: rows.map((row) => ({
      slug: row.slug,
      last_success_at: toIso(row.lastSuccessAt),
      last_error: row.lastError,
    })),
  };
}
