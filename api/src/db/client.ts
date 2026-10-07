import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import type { Env } from '../env';

export function getDb(env: Env) {
  return drizzle(neon(env.DATABASE_URL));
}

export type Db = ReturnType<typeof getDb>;
