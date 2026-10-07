import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';

import { ErrorCard } from '@/components/feed/error-card';
import { FeedError } from '@/components/feed/feed-error';
import { FeedFallback } from '@/components/feed/feed-fallback';
import { LoadMore } from '@/components/feed/load-more';
import { FilterBar } from '@/components/filters/filter-bar';
import { LeadStory } from '@/components/news/lead-story';
import { StoryList } from '@/components/news/story-list';
import { SectionTab } from '@/components/ui/section-tab';
import { HOME_ASIDE_COUNT } from '@/constants/feed';
import { useFeedPagination } from '@/hooks/useFeedPagination';
import {
  bangkokToday,
  categoriesQuery,
  feedQuery,
  quietFetch,
  sourcesQuery,
  type FeedLoaderData,
  type FeedSearch,
} from '@/utils/feed';
import { formatTime } from '@/utils/format';

type HomeSearch = Omit<FeedSearch, 'q'>;

export const Route = createFileRoute('/')({
  validateSearch: (raw: Record<string, unknown>): HomeSearch => ({
    category: typeof raw['category'] === 'string' ? raw['category'] : undefined,
    source: typeof raw['source'] === 'string' ? raw['source'] : undefined,
    cursor: typeof raw['cursor'] === 'string' ? raw['cursor'] : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }): Promise<FeedLoaderData> => {
    const [page, sources, categories] = await Promise.all([
      quietFetch(() => context.queryClient.query(feedQuery(deps))),
      quietFetch(() => context.queryClient.query(sourcesQuery)),
      quietFetch(() => context.queryClient.query(categoriesQuery(deps.source))),
    ]);
    return { page, sources, categories, today: bangkokToday() };
  },
  staleTime: 30_000,
  component: Newsroom,
  errorComponent: FeedError,
});

function Newsroom() {
  const search = Route.useSearch();
  const feedKey = `${search.category ?? ''}|${search.source ?? ''}`;

  return (
    <Suspense fallback={<FeedFallback message="กำลังโหลดข่าว…" />}>
      <Feed key={feedKey} />
    </Suspense>
  );
}

function Feed() {
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

  const [lead, ...rest] = items;
  const newest = items[0]?.last_seen_at ?? items[0]?.retrieved_at ?? items[0]?.published_at ?? null;

  const latest = rest.slice(0, HOME_ASIDE_COUNT);
  const more = rest.slice(HOME_ASIDE_COUNT);
  const today = loader.today;

  return (
    <main id="content" className="container max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 pt-5 sm:pt-10">
        <h1 className="text-title-md font-bold text-foreground sm:text-5xl">ข่าวหน่วยงานรัฐวันนี้</h1>
        <p className="text-sm text-muted-foreground">
          {today}
          {newest && ` · อัปเดต ${formatTime(newest)} น.`}
        </p>
      </div>

      <FilterBar
        sources={sources}
        categories={categories}
        source={search.source}
        category={search.category}
        target="home"
      />

      {error && <ErrorCard message={error} />}

      {lead ? (
        <div className="grid gap-8 pt-6 sm:pt-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            <LeadStory article={lead} />
          </div>
          {latest.length > 0 && (
            <section aria-labelledby="latest-heading" className="lg:col-span-4">
              <SectionTab id="latest-heading">ล่าสุด</SectionTab>
              <StoryList items={latest} />
            </section>
          )}
        </div>
      ) : (
        <div className="py-16">
          <h2 className="text-2xl font-bold text-foreground">ยังไม่มีข่าวจากหน่วยงานนี้</h2>
          <Link
            to="/"
            search={{ category: undefined, source: undefined, cursor: undefined }}
            className="mt-3 inline-block font-display font-semibold text-foreground underline decoration-accent"
          >
            ดูข่าวจากทุกหน่วยงาน
          </Link>
        </div>
      )}

      {more.length > 0 && (
        <section aria-labelledby="more-heading" className="mt-10">
          <div className="relative">
            <SectionTab id="more-heading">ข่าวก่อนหน้า</SectionTab>
            <Link
              to="/news"
              search={{ q: undefined, source: undefined, category: undefined }}
              className="absolute top-0 right-0 font-display text-sm leading-7 font-semibold text-muted-foreground hover:text-foreground"
            >
              ดูข่าวทั้งหมด →
            </Link>
          </div>
          <StoryList items={more} thumbnail className="grid gap-x-12 md:grid-cols-2" />
          <LoadMore cursor={cursor} loading={loadingMore} onLoadMore={loadMore} />
        </section>
      )}
    </main>
  );
}
