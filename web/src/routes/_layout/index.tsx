import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Suspense, useEffect, useState } from 'react'
import { fetchArticles, fetchSources, type ArticleItem } from '@/lib/api'
import { setFeedCount } from '@/lib/feed-meta'

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

function formatDate(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'long',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value))
}

function leadImage(item: ArticleItem) {
  return (item.attachments ?? [])[0]
}

function formatTime(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value))
}

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function excerpt(value: string, length = 220) {
  const text = cleanText(value)
  return text.length > length ? `${text.slice(0, length).trim()}…` : text
}

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
          <span className="size-1.5 rounded-full bg-coral" />
          อัปเดตล่าสุด ·{' '}
          {newest ? `${formatDate(newest)} · ${formatTime(newest)} น.` : 'ยังไม่มีข่าว'}
        </p>
        <h1 className="max-w-3xl text-balance font-display text-4xl font-bold leading-[1.15] text-ink sm:text-5xl">
          <span className="whitespace-nowrap">ข่าวภาครัฐไทย</span> <span className="whitespace-nowrap text-gold">ตรงจากต้นทาง</span>
        </h1>
      </section>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-coral/30 bg-paper p-6 text-center"
        >
          <p className="text-sm text-ink-soft">{error}</p>
        </div>
      )}

      {lead ? (
        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-paper transition-shadow hover:shadow-lg hover:shadow-ink/5 lg:col-span-2">
            {leadImage(lead) && (
              <img
                src={leadImage(lead)}
                alt=""
                loading="lazy"
                className="h-64 w-full object-cover md:h-80"
              />
            )}
            <div className="flex flex-1 flex-col p-6 md:p-8">
              <p className="text-[15px] font-semibold text-ink-soft">{lead.agency_name}</p>
              <h2 className="mt-3 text-pretty text-2xl font-bold leading-snug text-ink sm:text-3xl">
                <a
                  href={lead.canonical_url}
                  target="_blank"
                  rel="noreferrer"
                  className="after:absolute after:inset-0 group-hover:text-teal"
                >
                  {lead.title}
                </a>
              </h2>
              <p className="mt-4 mb-6 line-clamp-4 max-w-[65ch] text-[15px] leading-7 text-ink-soft lg:line-clamp-8">
                {excerpt(lead.summary || lead.body_text, leadImage(lead) ? 220 : 600)}
              </p>
              <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-xs text-ink-soft">
                <span>{formatDate(lead.published_at)}</span>
                <span className="inline-flex items-center gap-1 font-medium text-teal">
                  อ่านต่อที่ต้นฉบับ
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </article>
          <aside className="rounded-2xl border border-line bg-paper p-5 lg:self-start">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <span className="size-1.5 rounded-full bg-coral" />
              ข่าวล่าสุด
            </h2>
            <div className="mt-1 divide-y divide-line">
              {rest.slice(0, ASIDE_COUNT).map((article) => (
                <a
                  key={article.id}
                  href={article.canonical_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex gap-3 py-4 last:pb-0"
                >
                  {leadImage(article) && (
                    <img
                      src={leadImage(article)}
                      alt=""
                      loading="lazy"
                      className="size-16 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-ink-soft">
                      {article.agency_name} · {formatDate(article.published_at)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-ink group-hover:text-teal">
                      {article.title}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </aside>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-line bg-paper p-10 text-center">
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
        </div>
      )}

      {rest.length > ASIDE_COUNT && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-ink">ข่าวอื่น ๆ</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.slice(ASIDE_COUNT).map((article) => (
              <a
                key={article.id}
                href={article.canonical_url}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-paper transition hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-lg hover:shadow-ink/5"
              >
                {leadImage(article) && (
                  <img
                    src={leadImage(article)}
                    alt=""
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                )}
                <h3 className="line-clamp-3 px-5 pt-5 text-lg font-bold leading-7 text-ink group-hover:text-teal">
                  {article.title}
                </h3>
                <p className="mt-auto flex justify-between gap-3 px-5 pb-5 pt-4 text-xs text-ink-soft">
                  <span className="truncate">{article.agency_name}</span>
                  <span className="shrink-0">{formatDate(article.published_at)}</span>
                </p>
              </a>
            ))}
          </div>
          {cursor && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-paper px-6 text-sm font-medium text-ink transition hover:border-teal/50 hover:text-teal disabled:opacity-60"
              >
                {loadingMore ? 'กำลังโหลด…' : (<>โหลดข่าวเพิ่ม <ArrowRight className="size-4" /></>)}
              </button>
            </div>
          )}
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-lg font-bold text-ink">กรองตามหน่วยงาน</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {sources.map((s) => {
            const active = search.source === s.slug
            return (
              <Link
                key={s.slug}
                to="/"
                search={{ q: undefined, category: undefined, source: active ? undefined : s.slug, cursor: undefined }}
                aria-current={active ? 'true' : undefined}
                className={
                  active
                    ? 'rounded-full border border-ink bg-ink px-3 py-1 text-sm text-paper'
                    : 'rounded-full border border-line bg-paper/60 px-3 py-1 text-sm text-ink-soft transition hover:border-teal/50 hover:text-ink'
                }
              >
                {s.name_th}
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  )
}
