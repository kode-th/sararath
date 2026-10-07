import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';

import { ErrorCard } from '@/components/feed/error-card';
import { FeedError } from '@/components/feed/feed-error';
import { FeedFallback } from '@/components/feed/feed-fallback';
import { LoadMore } from '@/components/feed/load-more';
import { FilterBar } from '@/components/filters/filter-bar';
import { StoryList } from '@/components/news/story-list';
import { useFeedPagination } from '@/hooks/useFeedPagination';
import type { ArticlesPage, CategoryItem, NewsSourceItem } from '@/lib/api';
import {
  categoriesQuery,
  feedQuery,
  quietFetch,
  sourcesQuery,
  type FeedSearch,
} from '@/utils/feed';

type SearchSearch = Pick<FeedSearch, 'q' | 'source' | 'category'>;

interface SearchLoaderData {
  page: ArticlesPage | undefined;
  sources: NewsSourceItem[] | undefined;
  categories: CategoryItem[] | undefined;
}

export const Route = createFileRoute('/news')({
  validateSearch: (raw: Record<string, unknown>): SearchSearch => ({
    q: typeof raw['q'] === 'string' ? raw['q'] : undefined,
    source: typeof raw['source'] === 'string' ? raw['source'] : undefined,
    category: typeof raw['category'] === 'string' ? raw['category'] : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }): Promise<SearchLoaderData> => {
    const [page, sources, categories] = await Promise.all([
      quietFetch(() => context.queryClient.query(feedQuery(deps))),
      quietFetch(() => context.queryClient.query(sourcesQuery)),
      quietFetch(() => context.queryClient.query(categoriesQuery(deps.source, deps.q))),
    ]);
    return { page, sources, categories };
  },
  staleTime: 30_000,
  head: () => ({
    meta: [
      { title: 'ข่าวทั้งหมด · สาระรัฐ' },
      {
        name: 'description',
        content: 'ค้นหาและกรองข่าวจากหน่วยงานรัฐไทยทั้งหมดตามหน่วยงานและหมวดหมู่ พร้อมลิงก์กลับไปยังต้นฉบับ',
      },
    ],
  }),
  component: SearchPage,
  errorComponent: FeedError,
});

function SearchPage() {
  const search = Route.useSearch();

  return (
    <Suspense fallback={<FeedFallback message={search.q ? 'กำลังค้นหา…' : 'กำลังโหลดข่าว…'} />}>
      <Results key={`${search.q ?? ''}|${search.source ?? ''}|${search.category ?? ''}`} />
    </Suspense>
  );
}

function Results() {
  const search = Route.useSearch();
  const loader = Route.useLoaderData();
  const { data: page } = useSuspenseQuery({
    ...feedQuery(search),
    initialData: loader.page,
  });
  const { data: sources } = useSuspenseQuery({
    ...sourcesQuery,
    initialData: loader.sources,
  });
  const { data: categories } = useSuspenseQuery({
    ...categoriesQuery(search.source, search.q),
    initialData: loader.categories,
  });
  const { items, cursor, loadingMore, error, loadMore } = useFeedPagination(page, search);

  return (
    <main id="content" className="container max-w-6xl">
      <h1 className="pt-5 text-title-md font-bold text-foreground sm:pt-10 sm:text-5xl">
        {search.q ? `ผลการค้นหา “${search.q}”` : 'ข่าวทั้งหมด'}
      </h1>

      <FilterBar
        sources={sources}
        categories={categories}
        source={search.source}
        category={search.category}
        q={search.q}
        target="search"
      />

      {error && <ErrorCard message={error} />}

      {items.length === 0 ? (
        <div className="py-16">
          <h2 className="text-2xl font-bold text-foreground">
            {search.q ? `ไม่พบข่าวที่ตรงกับ “${search.q}”` : 'ไม่พบข่าวตามตัวกรองที่เลือก'}
          </h2>
          {search.source || search.category ? (
            <Link
              to="/news"
              search={{ q: search.q, source: undefined, category: undefined }}
              className="mt-3 inline-block font-display font-semibold text-foreground underline decoration-accent"
            >
              ล้างตัวกรอง
            </Link>
          ) : (
            <Link
              to="/"
              search={{ category: undefined, source: undefined, cursor: undefined }}
              className="mt-3 inline-block font-display font-semibold text-foreground underline decoration-accent"
            >
              ดูข่าวจากทุกหน่วยงาน
            </Link>
          )}
        </div>
      ) : (
        <section aria-label="ผลการค้นหา" className="mt-6">
          <StoryList items={items} thumbnail />
          <LoadMore cursor={cursor} loading={loadingMore} onLoadMore={loadMore} />
        </section>
      )}
    </main>
  );
}
