import { asc } from 'drizzle-orm';

import type { SourceOut } from '../../schemas';
import type { Db } from '../client';
import { sources } from '../generated/schema';
import { toIso } from '../row';

export async function listSources(db: Db): Promise<SourceOut[]> {
  const rows = await db
    .select({
      slug: sources.slug,
      nameTh: sources.nameTh,
      nameEn: sources.nameEn,
      collector: sources.collector,
      enabled: sources.enabled,
      lastSuccessAt: sources.lastSuccessAt,
      lastError: sources.lastError,
    })
    .from(sources)
    .orderBy(asc(sources.slug));

  return rows.map((row) => ({
    slug: row.slug,
    name_th: row.nameTh,
    name_en: row.nameEn,
    collector: row.collector,
    enabled: row.enabled,
    last_success_at: toIso(row.lastSuccessAt),
    last_error: row.lastError,
  }));
}
