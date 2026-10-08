import { infiniteQueryOptions, keepPreviousData, queryOptions } from '@tanstack/react-query';

import { FEED_LIMIT, LOAD_MORE_LIMIT } from '@/constants/feed';
import {
  fetchArticles,
  fetchCategories,
  fetchSources,
  fetchSuggest,
  type ArticlesPage,
  type NewsSourceItem,
} from '@/lib/api';

export interface FeedSearch {
  q?: string;
  category?: string;
  source?: string;
}

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
        limit: FEED_LIMIT,
      }),
    staleTime: 60_000,
  });

export const feedInfiniteQuery = (search: FeedSearch) =>
  infiniteQueryOptions({
    queryKey: ['feed', search],
    queryFn: ({ pageParam }) =>
      fetchArticles({
        q: search.q,
        category: search.category,
        source: search.source,
        cursor: pageParam,
        limit: pageParam ? LOAD_MORE_LIMIT : FEED_LIMIT,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    staleTime: 60_000,
  });

export const sourcesQuery = queryOptions({
  queryKey: ['news-sources'],
  queryFn: fetchSources,
  staleTime: 300_000,
});

export const categoriesQuery = (source?: string, q?: string) =>
  queryOptions({
    queryKey: ['categories', source ?? null, q ?? null],
    queryFn: () => fetchCategories(source, q),
    staleTime: 300_000,
  });

export const suggestQuery = (q: string) =>
  queryOptions({
    queryKey: ['suggest', q],
    queryFn: () => fetchSuggest(q),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export async function quietFetch<T>(run: () => Promise<T>): Promise<T | undefined> {
  try {
    return await run();
  } catch {
    return undefined;
  }
}

const bangkokDay = new Intl.DateTimeFormat('th-TH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Bangkok',
});

export function bangkokToday() {
  return bangkokDay.format(new Date());
}
