import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Mirrors the Alembic-owned schema in crawl/src/sararath/models.py.
// Read-only: Alchemy/Alembic remains the single migration owner; keep in sync
// when a migration changes columns.
export const sources = pgTable('sources', {
  id: uuid('id').primaryKey(),
  slug: text('slug').notNull(),
  nameTh: text('name_th').notNull(),
  nameEn: text('name_en').notNull(),
  collector: text('collector').notNull(),
  enabled: boolean('enabled').notNull(),
  crawlIntervalMinutes: integer('crawl_interval_minutes').notNull(),
  category: text('category').notNull(),
  homepageUrl: text('homepage_url').notNull(),
  feedUrl: text('feed_url'),
  agencyType: text('agency_type').notNull(),
  lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  lastError: text('last_error'),
});

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey(),
  sourceId: uuid('source_id')
    .notNull()
    .references(() => sources.id),
  externalId: text('external_id').notNull(),
  canonicalUrl: text('canonical_url').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  bodyText: text('body_text').notNull(),
  language: text('language').notNull(),
  category: text('category').notNull(),
  agencyName: text('agency_name').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  publishedRaw: text('published_raw').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
  contentHash: text('content_hash').notNull(),
  rawPath: text('raw_path'),
});

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey(),
  articleId: uuid('article_id')
    .notNull()
    .references(() => articles.id),
  url: text('url').notNull(),
  mediaType: text('media_type'),
  title: text('title'),
  checksum: text('checksum'),
});

export const collectorRuns = pgTable('collector_runs', {
  id: uuid('id').primaryKey(),
  sourceId: uuid('source_id')
    .notNull()
    .references(() => sources.id),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  status: text('status').notNull(),
  httpStatus: integer('http_status'),
  foundCount: integer('found_count').notNull(),
  insertedCount: integer('inserted_count').notNull(),
  skippedCount: integer('skipped_count').notNull(),
  error: text('error'),
});
