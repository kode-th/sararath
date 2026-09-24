import type { ArticleItem } from '@/lib/api'
import { formatDate, leadImage } from '@/lib/format'

export function StoryCard({ article }: Readonly<{ article: ArticleItem }>) {
  const image = leadImage(article)
  return (
    <a
      href={article.canonical_url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-paper transition hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-lg hover:shadow-ink/5"
    >
      {image && <img src={image} alt="" loading="lazy" className="aspect-video w-full object-cover" />}
      <h3 className="line-clamp-3 px-5 pt-5 text-lg font-bold leading-7 text-ink group-hover:text-teal">
        {article.title}
      </h3>
      <p className="mt-auto flex justify-between gap-3 px-5 pb-5 pt-4 text-xs text-ink-soft">
        <span className="truncate">{article.agency_name}</span>
        <span className="shrink-0">{formatDate(article.published_at)}</span>
      </p>
    </a>
  )
}
