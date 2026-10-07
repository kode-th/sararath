import createClient from 'openapi-fetch';

import type { components, paths } from '@/lib/api-schema';

export type ArticleItem = components['schemas']['ArticleOut'];
export type ArticlesPage = components['schemas']['ArticlesPage'];
export type CategoryItem = components['schemas']['CategoryOut'];
export type NewsSourceItem = components['schemas']['SourceOut'];
export type SuggestResult = components['schemas']['SuggestOut'];

export const API_URL = import.meta.env.VITE_API_URL ?? 'https://sararath-apis.fasu.dev';

const client = createClient<paths>({ baseUrl: API_URL });

export async function fetchArticles(params: {
  q?: string;
  source?: string;
  category?: string;
  limit?: number;
  cursor?: string;
}): Promise<ArticlesPage> {
  const { data, response } = await client.GET('/v1/articles', { params: { query: params } });
  if (!response.ok || !data) throw new Error(`api ${response.status}`);
  return data;
}

export async function fetchArticle(id: string): Promise<ArticleItem> {
  const { data, response } = await client.GET('/v1/articles/{article_id}', {
    params: { path: { article_id: id } },
  });
  if (!response.ok || !data) throw new Error(`api ${response.status}`);
  return data;
}

export async function fetchSuggest(q: string, limit = 6): Promise<SuggestResult> {
  const { data, response } = await client.GET('/v1/suggest', {
    params: { query: { q, limit } },
  });
  if (!response.ok || !data) throw new Error(`api ${response.status}`);
  return data;
}

export async function fetchSources(): Promise<NewsSourceItem[]> {
  const { data, response } = await client.GET('/v1/sources');
  if (!response.ok || !data) throw new Error(`api ${response.status}`);
  return data.items;
}

export async function fetchCategories(source?: string, q?: string): Promise<CategoryItem[]> {
  const { data, response } = await client.GET('/v1/categories', {
    params: { query: { source, q } },
  });
  if (!response.ok || !data) throw new Error(`api ${response.status}`);
  return data.items;
}

// The API answers 404 for a missing article and 422 for a malformed id.
export function isMissingArticle(error: unknown) {
  return error instanceof Error && (error.message === 'api 404' || error.message === 'api 422');
}
