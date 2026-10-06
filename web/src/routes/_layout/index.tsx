import { queryOptions, useQueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query'
import { ArrowDown, RotateCw } from 'lucide-react'
import { Link, createFileRoute, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { Suspense, useEffect, useState } from 'react'
import { AgencyTabs } from '@/components/news/agency-tabs'
import { LeadStory } from '@/components/news/lead-story'
import { StoryRow } from '@/components/news/story-row'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SectionTab } from '@/components/ui/section-tab'
import { fetchArticles, fetchSources, type ArticleItem, type ArticlesPage } from '@/lib/api'
import { formatTime, mergeDuplicates } from '@/lib/format'

interface FeedSearch {
  q?: string
  category?: string
  source?: string
  cursor?: string
}

export type NewsSourceItem = { slug: string; name_th: string }

interface FeedLoaderData {
  page: ArticlesPage | undefined
  sources: NewsSourceItem[] | undefined
}

export const Route = createFileRoute('/_layout/')({
  validateSearch: (raw: Record<string, unknown>): FeedSearch => ({
    q: typeof raw['q'] === 'string' ? raw['q'] : undefined,
    category: typeof raw['category'] === 'string' ? raw['category'] : undefined,
    source: typeof raw['source'] === 'string' ? raw['source'] : undefined,
    cursor: typeof raw['cursor'] === 'string' ? raw['cursor'] : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }): Promise<FeedLoaderData> => {
    const quiet = async <T,>(run: () => Promise<T>): Promise<T | undefined> => {
      try {
        return await run()
      } catch {
        return undefined
      }
    }
    const [page, sources] = await Promise.all([
      quiet(() => context.queryClient.query(feedQuery(deps))),
      quiet(() => context.queryClient.query(sourcesQuery)),
    ])
    return { page, sources }
  },
  staleTime: 30_000,
  component: Newsroom,
  errorComponent: FeedError,
})

const feedQuery = (search: FeedSearch) =>
  queryOptions({
    queryKey: ['articles', search],
    queryFn: () =>
      fetchArticles({
        q: search.q,
        category: search.category,
        source: search.source,
        cursor: search.cursor,
        limit: 12,
      }),
    staleTime: 60_000,
  })

const ASIDE_COUNT = 4

const sourcesQuery = queryOptions({
  queryKey: ['news-sources'],
  queryFn: fetchSources,
  staleTime: 300_000,
})

// The free API host sleeps when idle, so a failed first load is common.
function FeedError({ reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryReset = useQueryErrorResetBoundary()

  useEffect(() => {
    queryReset.reset()
  }, [queryReset])

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
      <h1 className="text-[2rem] font-bold text-foreground sm:text-5xl">โหลดข่าวไม่สำเร็จ</h1>
      <p className="mt-3 max-w-[60ch] text-pretty text-muted-foreground">
        เซิร์ฟเวอร์ข่าวอาจกำลังเริ่มทำงาน ซึ่งใช้เวลาประมาณหนึ่งนาที รอสักครู่แล้วกดลองใหม่
      </p>
      <Button
        onClick={() => {
          reset()
          void router.invalidate()
        }}
        className="mt-6"
      >
        <RotateCw aria-hidden="true" className="size-4" /> ลองใหม่
      </Button>
    </main>
  )
}

function Newsroom() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-[60vh] place-items-center">
          <p className="text-sm text-muted-foreground">กำลังโหลดข่าว…</p>
        </main>
      }
    >
      <Feed />
    </Suspense>
  )
}

function Feed() {
  const search = Route.useSearch()
  const loader = Route.useLoaderData()
  const { data: page } = useSuspenseQuery({
    ...feedQuery(search),
    initialData: loader.page,
  })
  const { data: sources } = useSuspenseQuery({
    ...sourcesQuery,
    initialData: loader.sources,
  })
  const [extra, setExtra] = useState<ArticleItem[]>([])
  const [cursor, setCursor] = useState(page.next_cursor)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setExtra([])
    setCursor(page.next_cursor)
  }, [page])

  async function loadMore() {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    setError('')
    try {
      const next = await fetchArticles({
        q: search.q,
        category: search.category,
        source: search.source,
        cursor,
        limit: 12,
      })
      setExtra((prev) => [...prev, ...next.items])
      setCursor(next.next_cursor)
    } catch {
      setError('โหลดข่าวเพิ่มไม่สำเร็จ ลองกดอีกครั้ง')
    } finally {
      setLoadingMore(false)
    }
  }

  const items = mergeDuplicates([...page.items, ...extra])
  const [lead, ...rest] = items
  const newest = items[0]?.retrieved_at ?? items[0]?.published_at ?? null

  const latest = rest.slice(0, ASIDE_COUNT)
  const more = rest.slice(ASIDE_COUNT)
  const today = new Intl.DateTimeFormat('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  }).format(new Date())

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 pt-5 sm:pt-10">
        <h1 className="text-[2rem] font-bold text-foreground sm:text-5xl">
          {search.q ? `ผลการค้นหา “${search.q}”` : 'สรุปข่าวรัฐวันนี้'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {today}
          {newest && ` · อัปเดต ${formatTime(newest)} น.`}
        </p>
      </div>

      <div className="mt-6">
        <AgencyTabs sources={sources} active={search.source} />
      </div>

      {error && (
        <Card role="alert" className="mt-6 border-destructive p-4 text-sm text-destructive">
          {error}
        </Card>
      )}

      {lead ? (
        <div className="grid gap-8 pt-6 sm:pt-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            <LeadStory article={lead} />
          </div>
          {latest.length > 0 && (
            <section aria-labelledby="latest-heading" className="lg:col-span-4">
              <SectionTab id="latest-heading">ล่าสุด</SectionTab>
              <ol>
                {latest.map((article) => (
                  <StoryRow key={article.id} article={article} />
                ))}
              </ol>
            </section>
          )}
        </div>
      ) : (
        <div className="py-16">
          <h2 className="text-2xl font-bold text-foreground">
            {search.q ? `ไม่พบข่าวที่ตรงกับ “${search.q}”` : 'ยังไม่มีข่าวจากหน่วยงานนี้'}
          </h2>
          <Link
            to="/"
            search={{ q: undefined, category: undefined, source: undefined, cursor: undefined }}
            className="mt-3 inline-block font-display font-semibold text-foreground underline decoration-highlight"
          >
            ดูข่าวจากทุกหน่วยงาน
          </Link>
        </div>
      )}

      {more.length > 0 && (
        <section aria-labelledby="more-heading" className="mt-10">
          <SectionTab id="more-heading">ข่าวก่อนหน้า</SectionTab>
          <ol className="grid gap-x-12 md:grid-cols-2">
            {more.map((article) => (
              <StoryRow key={article.id} article={article} thumbnail />
            ))}
          </ol>
          {cursor && (
            <Button onClick={loadMore} disabled={loadingMore} className="mt-6 w-full">
              {loadingMore ? 'กำลังโหลด…' : (<>โหลดข่าวเพิ่ม <ArrowDown aria-hidden="true" className="size-4" /></>)}
            </Button>
          )}
        </section>
      )}
    </main>
  )
}
