export const API_URL =
  import.meta.env.VITE_API_URL ?? 'https://thai-gov-news-apis.onrender.com'

export interface ArticleItem {
  id: string
  source: { slug: string; name_th: string }
  title: string
  summary: string | null
  body_text: string
  category: string
  agency_name: string
  canonical_url: string
  published_at: string | null
  published_raw: string
  retrieved_at: string | null
}

export interface ArticlesPage {
  items: ArticleItem[]
  next_cursor: string | null
}

export async function fetchArticles(params: {
  q?: string
  source?: string
  category?: string
  limit?: number
  cursor?: string
}): Promise<ArticlesPage> {
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.source) query.set('source', params.source)
  if (params.category) query.set('category', params.category)
  query.set('limit', String(params.limit ?? 20))
  if (params.cursor) query.set('cursor', params.cursor)
  const res = await fetch(`${API_URL}/v1/articles?${query}`)
  if (!res.ok) throw new Error(`api ${res.status}`)
  return res.json()
}

export async function fetchSources(): Promise<
  { slug: string; name_th: string }[]
> {
  const res = await fetch(`${API_URL}/v1/sources`)
  if (!res.ok) throw new Error(`api ${res.status}`)
  const body = await res.json()
  return body.items
}
