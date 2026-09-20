import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  fetchArticles,
  fetchSources,
  type ArticleItem,
} from '../lib/api'

export const Route = createFileRoute('/')({ component: Home })

function fmtDate(raw: string | null, published: string | null) {
  const value = published ?? raw ?? ''
  return value.slice(0, 10) || '—'
}

function Card({ item }: Readonly<{ item: ArticleItem }>) {
  const [open, setOpen] = useState(false)
  return (
    <article className="card">
      <div className="card-top">
        <span className="agency">{item.agency_name || item.source.name_th}</span>
        <span className="date">{fmtDate(item.published_raw, item.published_at)}</span>
      </div>
      <h2 className="headline" onClick={() => setOpen(!open)}>
        {item.title}
      </h2>
      {item.category && <div className="topic">{item.category}</div>}
      {open && <p className="body">{item.body_text}</p>}
      <a href={item.canonical_url} target="_blank" rel="noreferrer" className="src">
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
    <main>
      <h1>ข่าวภาครัฐไทย</h1>
      <div className="filters">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(undefined, true)}
          placeholder="ค้นหาข่าว..."
        />
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">ทุกหน่วยงาน</option>
          {sources.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name_th}
            </option>
          ))}
        </select>
        <button onClick={() => load(undefined, true)}>ค้นหา</button>
      </div>
      {error && <p className="error">{error}</p>}
      <p className="count">{items.length} ข่าว</p>
      {items.map((item) => (
        <Card key={item.id} item={item} />
      ))}
      {cursor && (
        <button disabled={loading} onClick={() => load(cursor)}>
          {loading ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
        </button>
      )}
    </main>
  )
}
