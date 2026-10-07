import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowDown } from 'lucide-react';
import { Suspense } from 'react';

import { AgencyTabs } from '@/components/news/agency-tabs';
import { CategorySelect } from '@/components/news/category-select';
import { FeedError } from '@/components/news/feed-error';
import { StoryRow } from '@/components/news/story-row';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

export const Route = createFileRoute('/_layout/search')({
  validateSearch: (raw: Record<string, unknown>): SearchSearch => ({
    q: typeof raw['q'] === 'string' ? raw['q'] : undefined,
    source: typeof raw['source'] === 'string' ? raw['source'] : undefined,
    category: typeof raw['category'] === 'string' ? raw['category'] : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }): Promise<SearchLoaderData> => {
    const [page, sources, categories] = await Promise.all([
      deps.q ? quietFetch(() => context.queryClient.query(feedQuery(deps))) : undefined,
      quietFetch(() => context.queryClient.query(sourcesQuery)),
      quietFetch(() => context.queryClient.query(categoriesQuery(deps.source))),
    ]);
    return { page, sources, categories };
  },
  staleTime: 30_000,
  component: SearchPage,
  errorComponent: FeedError,
});

function SearchPage() {
  const { q, source, category } = Route.useSearch();

  if (!q) {
    return (
      <main className="container max-w-6xl py-16">
        <h1 className="text-title-md font-bold text-foreground sm:text-5xl">ค้นหาข่าว</h1>
        <p className="mt-3 max-w-[60ch] text-muted-foreground">
          พิมพ์คำค้นหาในช่องด้านบนเพื่อค้นหาข่าวจากหน่วยงานรัฐ
        </p>
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="grid min-h-[60vh] place-items-center">
          <p className="text-sm text-muted-foreground">กำลังค้นหา…</p>
        </main>
      }
    >
      <Results key={`${q}|${source ?? ''}|${category ?? ''}`} />
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
    ...categoriesQuery(search.source),
    initialData: loader.categories,
  });
  const { items, cursor, loadingMore, error, loadMore } = useFeedPagination(page, search);

  return (
    <main className="container max-w-6xl">
      <h1 className="pt-5 text-title-md font-bold text-foreground sm:pt-10 sm:text-5xl">
        ผลการค้นหา “{search.q}”
      </h1>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <AgencyTabs sources={sources} active={search.source} q={search.q} />
        <CategorySelect
          categories={categories}
          source={search.source}
          active={search.category}
          q={search.q}
        />
      </div>

      {error && (
        <Card role="alert" className="mt-6 border-destructive p-4 text-sm text-destructive">
          {error}
        </Card>
      )}

      {items.length === 0 ? (
        <div className="py-16">
          <h2 className="text-2xl font-bold text-foreground">ไม่พบข่าวที่ตรงกับ “{search.q}”</h2>
          {search.source ? (
            <Link
              to="/search"
              search={{ q: search.q, source: undefined }}
              className="mt-3 inline-block font-display font-semibold text-foreground underline decoration-accent"
            >
              ล้างตัวกรองหน่วยงาน
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
          <ol>
            {items.map((article) => (
              <StoryRow key={article.id} article={article} thumbnail />
            ))}
          </ol>
          {cursor && (
            <Button onClick={loadMore} disabled={loadingMore} className="mt-6 w-full">
              {loadingMore ? (
                'กำลังโหลด…'
              ) : (
                <>
                  โหลดข่าวเพิ่ม <ArrowDown aria-hidden="true" className="size-4" />
                </>
              )}
            </Button>
          )}
        </section>
      )}
    </main>
  );
}
