/// <reference types="node" />
import { defineConfig } from 'drizzle-kit';

// `drizzle-kit pull` introspects the live DB and regenerates
// `src/db/generated/schema.ts`. The DB (owned by Alembic in crawl/) is the
// single source of truth; never hand-edit the generated file.
export default defineConfig({
  dialect: 'postgresql',
  out: './src/db/generated',
  tablesFilter: ['sources', 'articles', 'attachments', 'collector_runs'],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
