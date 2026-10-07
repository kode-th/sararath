import { z } from 'zod';

import type { RunOut } from '../schemas';
import type { Sql } from './client';
import { dbInt, timestamp, toIso } from './row';

const runRowSchema = z.object({
  started_at: timestamp,
  finished_at: timestamp,
  status: z.string(),
  http_status: z.number().nullable(),
  found_count: dbInt,
  inserted_count: dbInt,
  skipped_count: dbInt,
  error: z.string().nullable(),
  slug: z.string(),
});

export async function listRuns(
  sql: Sql,
  source: string | undefined,
  limit: number,
): Promise<RunOut[]> {
  const rows = runRowSchema.array().parse(
    await sql`
    SELECT r.started_at, r.finished_at, r.status, r.http_status, r.found_count,
           r.inserted_count, r.skipped_count, r.error, s.slug
    FROM collector_runs r
    JOIN sources s ON r.source_id = s.id
    ${source ? sql`WHERE s.slug = ${source}` : sql``}
    ORDER BY r.started_at DESC
    LIMIT ${limit}
  `,
  );
  return rows.map((row) => ({
    source: row.slug,
    started_at: toIso(row.started_at) ?? '',
    finished_at: toIso(row.finished_at),
    status: row.status,
    http_status: row.http_status,
    found_count: row.found_count,
    inserted_count: row.inserted_count,
    skipped_count: row.skipped_count,
    error: row.error,
  }));
}
