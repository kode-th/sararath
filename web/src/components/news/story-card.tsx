import type { ArticleItem } from '@/lib/api'
import { formatDate, leadImage } from '@/lib/format'

export function StoryCard({ article }: Readonly<{ article: ArticleItem }>) {
  const image = leadImage(article)
  return (
    <a
      href={article.canonical_url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-lg hover:shadow-foreground/5"
    >
      {image && <img src={image} alt="" loading="lazy" className="aspect-video w-full object-cover" />}
      <h3 className="line-clamp-3 px-5 pt-5 text-lg font-bold leading-7 text-foreground group-hover:text-accent-foreground">
        {article.title}
      </h3>
      <p className="mt-auto flex justify-between gap-3 px-5 pb-5 pt-4 text-xs text-muted-foreground">
        <span className="truncate">{article.agency_name}</span>
        <span className="shrink-0">{formatDate(article.published_at)}</span>
      </p>
    </a>
  )
}
