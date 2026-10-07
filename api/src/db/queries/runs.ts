import { desc, eq } from 'drizzle-orm';

import type { RunOut } from '../../schemas';
import type { Db } from '../client';
import { collectorRuns, sources } from '../generated/schema';
import { toIso } from '../row';

export async function listRuns(
  db: Db,
  source: string | undefined,
  limit: number,
): Promise<RunOut[]> {
  const rows = await db
    .select({
      startedAt: collectorRuns.startedAt,
      finishedAt: collectorRuns.finishedAt,
      status: collectorRuns.status,
      httpStatus: collectorRuns.httpStatus,
      foundCount: collectorRuns.foundCount,
      insertedCount: collectorRuns.insertedCount,
      skippedCount: collectorRuns.skippedCount,
      error: collectorRuns.error,
      slug: sources.slug,
    })
    .from(collectorRuns)
    .innerJoin(sources, eq(collectorRuns.sourceId, sources.id))
    .where(source ? eq(sources.slug, source) : undefined)
    .orderBy(desc(collectorRuns.startedAt))
    .limit(limit);

  return rows.map((row) => ({
    source: row.slug,
    started_at: toIso(row.startedAt) ?? '',
    finished_at: toIso(row.finishedAt),
    status: row.status,
    http_status: row.httpStatus,
    found_count: row.foundCount,
    inserted_count: row.insertedCount,
    skipped_count: row.skippedCount,
    error: row.error,
  }));
}
