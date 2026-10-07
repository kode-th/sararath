import { neon } from '@neondatabase/serverless';

import type { Env } from '../env';

export type Sql = ReturnType<typeof neon>;

export function getSql(env: Env): Sql {
  return neon(env.DATABASE_URL);
}
