import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { fetchArticles, fetchSources, type ArticleItem } from '../lib/api'

export const Route = createFileRoute('/')({ component: Home })

function Card({ item }: Readonly<{ item: ArticleItem }>) {
  const [open, setOpen] = useState(false)
  return (
    <article className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between text-sm text-neutral-500">
        <span>{item.agency_name || item.source.name_th}</span>
        <span>{(item.published_at ?? item.published_raw ?? '').slice(0, 10)}</span>
      </div>
      <h2 className="mt-2 text-lg font-semibold">
        <button
          className="cursor-pointer text-left"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {item.title}
        </button>
      </h2>
      {item.category && <p className="mt-1 text-sm text-neutral-500">{item.category}</p>}
      {open && <p className="mt-2 whitespace-pre-wrap text-[15px]">{item.body_text}</p>}
      <a
        href={item.canonical_url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-sm text-blue-700 underline"
      >
        แหล่งข่าวต้นฉบับ
      </a>
    </article>
  )
}

function Home() {
  const [items, setItems] = useState<ArticleItem[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [sources, setSources] = useState<{ slug: string; name_th: string }[]>([])
  const [q, setQ] = useState('')
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load(next?: string, reset = false) {
    setLoading(true)
    setError('')
    try {
      const page = await fetchArticles({
        q: q || undefined,
        source: source || undefined,
        limit: 20,
        cursor: next,
      })
      setItems(reset ? page.items : [...items, ...page.items])
      setCursor(page.next_cursor)
    } catch {
      setError('โหลดข่าวไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSources().then(setSources).catch(() => { })
    load(undefined, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="mx-auto my-10 w-[min(42rem,calc(100%-2rem))]">
      <h1 className="text-2xl font-bold">ข่าวภาครัฐไทย</h1>
      <div className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(undefined, true)}
          placeholder="ค้นหาข่าว..."
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2"
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-md border border-neutral-300 px-2 py-2"
        >
          <option value="">ทุกหน่วยงาน</option>
          {sources.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name_th}
            </option>
          ))}
        </select>
        <button
          onClick={() => load(undefined, true)}
          className="rounded-md bg-neutral-900 px-4 py-2 text-white"
        >
          ค้นหา
        </button>
      </div>
      {error && <p className="mt-3 text-red-700">{error}</p>}
      <p className="mt-3 text-sm text-neutral-500">{items.length} ข่าว</p>
      <div className="mt-3 grid gap-3">
        {items.map((item) => (
          <Card key={item.id} item={item} />
        ))}
      </div>
      {!loading && items.length === 0 && !error && (
        <p className="py-10 text-center text-neutral-500">ไม่พบข่าว</p>
      )}
      {cursor && (
        <button
          disabled={loading}
          onClick={() => load(cursor)}
          className="mt-4 w-full rounded-md border border-neutral-300 py-2"
        >
          {loading ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
        </button>
      )}
    </main>
  )
}
