import { z } from 'zod';

import type { SourceOut } from '../schemas';
import type { Sql } from './client';
import { timestamp, toIso } from './row';

const sourceRowSchema = z.object({
  slug: z.string(),
  name_th: z.string(),
  name_en: z.string(),
  collector: z.string(),
  enabled: z.boolean(),
  last_success_at: timestamp,
  last_error: z.string().nullable(),
});

export async function listSources(sql: Sql): Promise<SourceOut[]> {
  const rows = sourceRowSchema.array().parse(
    await sql`
    SELECT slug, name_th, name_en, collector, enabled, last_success_at, last_error
    FROM sources ORDER BY slug
  `,
  );
  return rows.map((row) => ({
    slug: row.slug,
    name_th: row.name_th,
    name_en: row.name_en,
    collector: row.collector,
    enabled: row.enabled,
    last_success_at: toIso(row.last_success_at),
    last_error: row.last_error,
  }));
}
