import { queryOptions } from '@tanstack/react-query';

import { FEED_LIMIT } from '@/constants/feed';
import { fetchArticles, fetchSources, type ArticlesPage } from '@/lib/api';

export interface FeedSearch {
  q?: string;
  category?: string;
  source?: string;
  cursor?: string;
}

export type NewsSourceItem = { slug: string; name_th: string };

export interface FeedLoaderData {
  page: ArticlesPage | undefined;
  sources: NewsSourceItem[] | undefined;
  today: string;
}

export const feedQuery = (search: FeedSearch) =>
  queryOptions({
    queryKey: ['articles', search],
    queryFn: () =>
      fetchArticles({
        q: search.q,
        category: search.category,
        source: search.source,
        cursor: search.cursor,
        limit: FEED_LIMIT,
      }),
    staleTime: 60_000,
  });

export const sourcesQuery = queryOptions({
  queryKey: ['news-sources'],
  queryFn: fetchSources,
  staleTime: 300_000,
});

export async function quietFetch<T>(run: () => Promise<T>): Promise<T | undefined> {
  try {
    return await run();
  } catch {
    return undefined;
  }
}

export function bangkokToday() {
  return new Intl.DateTimeFormat('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  }).format(new Date());
}
