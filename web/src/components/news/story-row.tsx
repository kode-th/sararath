import type { ArticleItem } from '@/lib/api'
import { formatDate, leadImage } from '@/lib/format'

export function StoryRow({ article }: Readonly<{ article: ArticleItem }>) {
  const image = leadImage(article)
  return (
    <a
      href={article.canonical_url}
      target="_blank"
      rel="noreferrer"
      className="group flex gap-3 py-4 last:pb-0"
    >
      {image && <img src={image} alt="" loading="lazy" className="size-16 shrink-0 rounded-lg object-cover" />}
      <div className="min-w-0">
        <p className="truncate text-[11px] text-ink-soft">
          {article.agency_name} · {formatDate(article.published_at)}
        </p>
        <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-ink group-hover:text-teal">
          {article.title}
        </p>
      </div>
    </a>
  )
}
