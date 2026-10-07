import type { AppType } from '@sararath/api';
import { hc, type InferResponseType } from 'hono/client';
import { env } from 'virtual:env/client';

const client = hc<AppType>(env.VITE_API_URL);

export type ArticlesPage = InferResponseType<typeof client.v1.articles.$get, 200>;
export type ArticleItem = ArticlesPage['items'][number];
export type CategoryItem = InferResponseType<
  typeof client.v1.categories.$get,
  200
>['items'][number];
export type NewsSourceItem = InferResponseType<typeof client.v1.sources.$get, 200>['items'][number];
export type SuggestResult = InferResponseType<typeof client.v1.suggest.$get, 200>;

export async function fetchArticles(params: {
  q?: string;
  source?: string;
  category?: string;
  limit?: number;
  cursor?: string;
}): Promise<ArticlesPage> {
  const res = await client.v1.articles.$get({
    query: {
      ...(params.q ? { q: params.q } : {}),
      ...(params.source ? { source: params.source } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.cursor ? { cursor: params.cursor } : {}),
      limit: String(params.limit ?? 20),
    },
  });
  if (!res.ok) throw new Error(`api ${res.status}`);
  return res.json();
}

export async function fetchArticle(id: string): Promise<ArticleItem> {
  const res = await client.v1.articles[':article_id'].$get({
    param: { article_id: id },
  });
  if (!res.ok) throw new Error(`api ${res.status}`);
  return res.json();
}

export async function fetchSuggest(q: string, limit = 6): Promise<SuggestResult> {
  const res = await client.v1.suggest.$get({
    query: { q, limit: String(limit) },
  });
  if (!res.ok) throw new Error(`api ${res.status}`);
  return res.json();
}

export async function fetchSources(): Promise<NewsSourceItem[]> {
  const res = await client.v1.sources.$get();
  if (!res.ok) throw new Error(`api ${res.status}`);
  const data = await res.json();
  return data.items;
}

export async function fetchCategories(source?: string, q?: string): Promise<CategoryItem[]> {
  const res = await client.v1.categories.$get({
    query: { ...(source ? { source } : {}), ...(q ? { q } : {}) },
  });
  if (!res.ok) throw new Error(`api ${res.status}`);
  const data = await res.json();
  return data.items;
}

// The API answers 404 for a missing article and 422 for a malformed id.
export function isMissingArticle(error: unknown) {
  return error instanceof Error && (error.message === 'api 404' || error.message === 'api 422');
}
