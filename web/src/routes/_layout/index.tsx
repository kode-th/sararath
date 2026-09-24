import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Suspense, useEffect, useState } from 'react'
import { LeadStory } from '@/components/news/lead-story'
import { SourceChip } from '@/components/news/source-chip'
import { StoryCard } from '@/components/news/story-card'
import { StoryRow } from '@/components/news/story-row'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LiveDot } from '@/components/ui/live-dot'
import { fetchArticles, fetchSources, type ArticleItem } from '@/lib/api'
import { setFeedCount } from '@/lib/feed-meta'
import { formatDate, formatTime } from '@/lib/format'

interface FeedSearch {
  q?: string
  category?: string
  source?: string
  cursor?: string
}

export const Route = createFileRoute('/_layout/')({
  validateSearch: (raw: Record<string, unknown>): FeedSearch => ({
    q: typeof raw['q'] === 'string' ? raw['q'] : undefined,
    category: typeof raw['category'] === 'string' ? raw['category'] : undefined,
    source: typeof raw['source'] === 'string' ? raw['source'] : undefined,
    cursor: typeof raw['cursor'] === 'string' ? raw['cursor'] : undefined,
  }),
  component: Newsroom,
})

function dedupe(items: ArticleItem[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.source.slug}|${item.title.trim()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

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

const ASIDE_COUNT = 5

const sourcesQuery = queryOptions({
  queryKey: ['news-sources'],
  queryFn: fetchSources,
  staleTime: 300_000,
})

function Newsroom() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-[60vh] place-items-center">
          <p className="text-sm text-ink-soft">กำลังโหลดข่าว…</p>
        </main>
      }
    >
      <Feed />
    </Suspense>
  )
}

function Feed() {
  const search = Route.useSearch()
  const { data: page } = useSuspenseQuery(feedQuery(search))
  const { data: sources } = useSuspenseQuery(sourcesQuery)
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

  const items = dedupe([...page.items, ...extra])
  const [lead, ...rest] = items
  const newest = items[0]?.retrieved_at ?? items[0]?.published_at ?? null

  useEffect(() => {
    setFeedCount(items.length)
  }, [items.length])

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
      <section className="mt-10">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 font-mono text-[11px] text-ink-soft">
          <LiveDot />
          อัปเดตล่าสุด ·{' '}
          {newest ? `${formatDate(newest)} · ${formatTime(newest)} น.` : 'ยังไม่มีข่าว'}
        </p>
        <h1 className="max-w-3xl text-balance font-display text-4xl font-bold leading-[1.15] text-ink sm:text-5xl">
          <span className="whitespace-nowrap">ข่าวภาครัฐไทย</span> <span className="whitespace-nowrap text-gold">ตรงจากต้นทาง</span>
        </h1>
      </section>

      {error && (
        <Card role="alert" className="mt-6 border-coral/30 p-6 text-center">
          <p className="text-sm text-ink-soft">{error}</p>
        </Card>
      )}

      {lead ? (
        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          <LeadStory article={lead} className="lg:col-span-2" />
          <Card className="p-5 lg:self-start">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <LiveDot />
              ข่าวล่าสุด
            </h2>
            <div className="mt-1 divide-y divide-line">
              {rest.slice(0, ASIDE_COUNT).map((article) => (
                <StoryRow key={article.id} article={article} />
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="mt-8 p-10 text-center">
          <h2 className="text-xl font-bold text-ink">
            {search.q ? `ไม่พบข่าวที่ตรงกับ “${search.q}”` : 'ยังไม่มีข่าวในหมวดนี้'}
          </h2>
          <Link
            to="/"
            search={{ q: undefined, category: undefined, source: undefined, cursor: undefined }}
            className="mt-3 inline-block text-sm font-medium text-teal hover:underline"
          >
            ดูข่าวทั้งหมด
          </Link>
        </Card>
      )}

      {rest.length > ASIDE_COUNT && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-ink">ข่าวอื่น ๆ</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.slice(ASIDE_COUNT).map((article) => (
              <StoryCard key={article.id} article={article} />
            ))}
          </div>
          {cursor && (
            <div className="mt-8 flex justify-center">
              <Button onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'กำลังโหลด…' : (<>โหลดข่าวเพิ่ม <ArrowRight className="size-4" /></>)}
              </Button>
            </div>
          )}
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-lg font-bold text-ink">กรองตามหน่วยงาน</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {sources.map((s) => (
            <SourceChip key={s.slug} slug={s.slug} name={s.name_th} active={search.source === s.slug} />
          ))}
        </div>
      </section>
    </main>
  )
}
