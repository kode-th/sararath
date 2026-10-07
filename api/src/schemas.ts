import { z } from 'zod';

/** Timestamps are serialized as ISO-8601 strings (UTC, `Z`), matching the former FastAPI output. */
const timestamp = z.string().nullable();

export const SourceRefSchema = z.object({
  slug: z.string(),
  name_th: z.string(),
});

export const ArticleSchema = z.object({
  id: z.string(),
  source: SourceRefSchema,
  title: z.string(),
  summary: z.string().nullable(),
  body_text: z.string(),
  category: z.string(),
  agency_name: z.string(),
  canonical_url: z.string(),
  language: z.string(),
  published_at: timestamp,
  published_raw: z.string(),
  retrieved_at: timestamp,
  last_seen_at: timestamp,
  attachments: z.array(z.string()),
});

export const ArticlesPageSchema = z.object({
  items: z.array(ArticleSchema),
  next_cursor: z.string().nullable(),
});

export const CategorySchema = z.object({
  value: z.string(),
  count: z.number(),
});

export const CategoriesPageSchema = z.object({
  items: z.array(CategorySchema),
});

export const SuggestArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export const SuggestSchema = z.object({
  sources: z.array(SourceRefSchema),
  articles: z.array(SuggestArticleSchema),
});

export const RunSchema = z.object({
  source: z.string(),
  started_at: z.string(),
  finished_at: timestamp,
  status: z.string(),
  http_status: z.number().nullable(),
  found_count: z.number(),
  inserted_count: z.number(),
  skipped_count: z.number(),
  error: z.string().nullable(),
});

export const RunsPageSchema = z.object({
  items: z.array(RunSchema),
});

export const SourceSchema = z.object({
  slug: z.string(),
  name_th: z.string(),
  name_en: z.string(),
  collector: z.string(),
  enabled: z.boolean(),
  last_success_at: timestamp,
  last_error: z.string().nullable(),
});

export const SourcesPageSchema = z.object({
  items: z.array(SourceSchema),
});

export const HealthSourceSchema = z.object({
  slug: z.string(),
  last_success_at: timestamp,
  last_error: z.string().nullable(),
});

export const HealthSchema = z.object({
  db: z.string(),
  sources: z.array(HealthSourceSchema),
});

export const ErrorSchema = z.object({
  detail: z.string(),
});

function isCalendarDate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isCalendarDate);

export const articlesQuerySchema = z.object({
  source: z.string().optional(),
  agency: z.string().optional(),
  category: z.string().optional(),
  published_from: dateOnly.optional(),
  published_to: dateOnly.optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const categoriesQuerySchema = z.object({
  source: z.string().optional(),
  q: z.string().optional(),
});

export const suggestQuerySchema = z.object({
  q: z.string().default(''),
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

export const runsQuerySchema = z.object({
  source: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const articleIdParamSchema = z.object({
  article_id: z.string(),
});

export type ArticleOut = z.infer<typeof ArticleSchema>;
export type ArticlesPage = z.infer<typeof ArticlesPageSchema>;
export type SuggestOut = z.infer<typeof SuggestSchema>;
export type CategoryOut = z.infer<typeof CategorySchema>;
export type SourceOut = z.infer<typeof SourceSchema>;
export type RunOut = z.infer<typeof RunSchema>;
export type HealthOut = z.infer<typeof HealthSchema>;
