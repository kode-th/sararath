import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { fetchArticles, fetchSources, type ArticleItem } from '@/lib/api'
import { setFeedCount } from '@/lib/feed-meta'

export const Route = createFileRoute('/_layout/')({
  validateSearch: (raw: Record<string, unknown>) => ({
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

function formatTime(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value))
}

function Newsroom() {
  const search = Route.useSearch()
  const [items, setItems] = useState<ArticleItem[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [sources, setSources] = useState<{ slug: string; name_th: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const [page, sourceList] = await Promise.all([
          fetchArticles({
            q: search.q,
            category: search.category,
            source: search.source,
            cursor: search.cursor,
            limit: 12,
          }),
          fetchSources(),
        ])
        if (cancelled) return
        setItems(page.items)
        setCursor(page.next_cursor)
        setSources(sourceList)
        setFeedCount(page.items.length)
      } catch {
        if (!cancelled) setError('ไม่สามารถเชื่อมต่อแหล่งข่าวได้')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [search])

  async function loadMore() {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const page = await fetchArticles({
        q: search.q,
        category: search.category,
        source: search.source,
        cursor,
        limit: 12,
      })
      setItems((prev) => [...prev, ...page.items])
      setCursor(page.next_cursor)
    } catch {
      setError('ไม่สามารถเชื่อมต่อแหล่งข่าวได้')
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-[60vh] place-items-center">
        <p className="text-sm text-ink-soft">กำลังรับข่าวจากต้นทาง</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="grid min-h-[60vh] place-items-center px-4">
        <div
          role="alert"
          className="max-w-md rounded-2xl border border-line bg-paper p-8 text-center"
        >
          <h1 className="text-xl font-bold text-ink">แหล่งข่าวไม่ตอบสนอง</h1>
          <p className="mt-2 text-sm text-ink-soft">{error}</p>
        </div>
      </main>
    )
  }

  const [lead, ...rest] = items
  const newest = items[0]?.retrieved_at ?? items[0]?.published_at ?? null

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
      <section className="mt-10">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 font-mono text-[11px] text-ink-soft">
          <span className="size-1.5 rounded-full bg-coral" />
          ข่าวล่าสุด ·{' '}
          {newest ? `${formatDate(newest)} · ${formatTime(newest)} น.` : 'กำลังอัปเดต'}
        </p>
        <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.08] text-ink sm:text-5xl">
          ข่าวราชการไทย <span className="text-gold">ตรงจากต้นทาง</span>
        </h1>
      </section>

      {lead ? (
        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          <article className="rounded-2xl border border-line bg-paper p-6 md:p-8 lg:col-span-2">
            <p className="text-[15px] font-semibold text-ink">{lead.agency_name}</p>
            <h2 className="mt-3 text-2xl font-bold leading-snug text-ink sm:text-3xl">
              {lead.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-ink-soft">
              {lead.summary || lead.body_text.slice(0, 220)}
            </p>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs text-ink-soft">
              <span>{formatDate(lead.published_at)}</span>
              <a
                href={lead.canonical_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-teal"
              >
                อ่านจากต้นทาง
              </a>
            </div>
          </article>
          <aside className="rounded-2xl border border-line bg-paper p-5">
            <h2 className="text-sm font-bold text-ink">สดจากหน่วยงาน</h2>
            <div className="divide-y divide-line">
              {rest.slice(0, 3).map((article) => (
                <a
                  key={article.id}
                  href={article.canonical_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block py-4"
                >
                  <p className="font-mono text-[10px] text-ink-soft">{article.agency_name}</p>
                  <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-6">
                    {article.title}
                  </p>
                </a>
              ))}
            </div>
          </aside>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-line bg-paper p-10 text-center">
          <h2 className="text-xl font-bold text-ink">ไม่พบข่าวที่ตรงกับการค้นหา</h2>
        </div>
      )}

      {rest.length > 3 && (
        <section className="mt-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.slice(3, 9).map((article) => (
              <article
                key={article.id}
                className="rounded-2xl border border-line bg-paper p-5"
              >
                <p className="font-mono text-[10px] text-teal">{article.category}</p>
                <h3 className="mt-2 line-clamp-3 text-lg font-bold leading-7 text-ink">
                  {article.title}
                </h3>
                <p className="mt-2 text-[11px] text-ink-soft">{article.agency_name}</p>
              </article>
            ))}
          </div>
          {cursor && (
            <div className="mt-7 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="h-11 rounded-lg border border-line bg-paper px-6 disabled:opacity-60"
              >
                {loadingMore ? 'กำลังโหลด...' : 'ดูข่าวถัดไป →'}
              </button>
            </div>
          )}
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-bold text-ink">แหล่งข่าวภาครัฐ</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {sources.map((s) => (
            <span
              key={s.slug}
              className="rounded-full border border-line px-3 py-1 text-sm text-ink-soft"
            >
              {s.name_th}
            </span>
          ))}
        </div>
      </section>
    </main>
  )
}
