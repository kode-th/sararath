import { pgTable, foreignKey, uuid, timestamp, text, integer, unique, boolean, index } from "drizzle-orm/pg-core"

export const collectorRuns = pgTable("collector_runs", {
	id: uuid().primaryKey().notNull(),
	sourceId: uuid("source_id").notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).notNull(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
	status: text().notNull(),
	httpStatus: integer("http_status"),
	foundCount: integer("found_count").notNull(),
	insertedCount: integer("inserted_count").notNull(),
	skippedCount: integer("skipped_count").notNull(),
	error: text(),
}, (table) => [
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [sources.id],
			name: "collector_runs_source_id_fkey"
		}),
]);

export const sources = pgTable("sources", {
	id: uuid().primaryKey().notNull(),
	slug: text().notNull(),
	nameTh: text("name_th").notNull(),
	nameEn: text("name_en").notNull(),
	agencyType: text("agency_type").notNull(),
	homepageUrl: text("homepage_url").notNull(),
	feedUrl: text("feed_url"),
	collector: text().notNull(),
	enabled: boolean().notNull(),
	crawlIntervalMinutes: integer("crawl_interval_minutes").notNull(),
	lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true, mode: 'string' }),
	lastSuccessAt: timestamp("last_success_at", { withTimezone: true, mode: 'string' }),
	lastError: text("last_error"),
	robotsOk: boolean("robots_ok").notNull(),
	category: text().notNull(),
}, (table) => [
	unique("sources_slug_key").on(table.slug),
]);

export const attachments = pgTable("attachments", {
	id: uuid().primaryKey().notNull(),
	articleId: uuid("article_id").notNull(),
	url: text().notNull(),
	mediaType: text("media_type"),
	title: text(),
	checksum: text(),
}, (table) => [
	foreignKey({
			columns: [table.articleId],
			foreignColumns: [articles.id],
			name: "attachments_article_id_fkey"
		}),
]);

export const articles = pgTable("articles", {
	id: uuid().primaryKey().notNull(),
	sourceId: uuid("source_id").notNull(),
	externalId: text("external_id").notNull(),
	canonicalUrl: text("canonical_url").notNull(),
	title: text().notNull(),
	summary: text(),
	bodyText: text("body_text").notNull(),
	language: text().notNull(),
	category: text().notNull(),
	agencyName: text("agency_name").notNull(),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	publishedRaw: text("published_raw").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	firstSeenAt: timestamp("first_seen_at", { withTimezone: true, mode: 'string' }).notNull(),
	lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: 'string' }).notNull(),
	contentHash: text("content_hash").notNull(),
	rawPath: text("raw_path"),
}, (table) => [
	index("ix_articles_published_at").using("btree", table.publishedAt.asc().nullsLast().op("timestamptz_ops"), table.id.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [sources.id],
			name: "articles_source_id_fkey"
		}),
	unique("articles_canonical_url_key").on(table.canonicalUrl),
	unique("articles_source_id_external_id_key").on(table.sourceId, table.externalId),
]);
