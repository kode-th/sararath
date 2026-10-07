import { asc, sql } from 'drizzle-orm';

import type { Db } from '@api/db/client';
import { sources } from '@api/db/generated/schema';
import { toIso } from '@api/db/row';
import type { HealthOut } from '@api/schemas';

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
