import { ArrowUpRight } from 'lucide-react'
import type { ArticleItem } from '@/lib/api'
import { excerpt, formatDate, leadImage } from '@/lib/format'
import { Card } from '@/components/ui/card'

export function LeadStory({ article, className = '' }: Readonly<{ article: ArticleItem; className?: string }>) {
  const image = leadImage(article)
  return (
    <Card
      className={`group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg hover:shadow-ink/5 ${className}`}
    >
      {image && <img src={image} alt="" loading="lazy" className="h-64 w-full object-cover md:h-80" />}
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <p className="text-[15px] font-semibold text-ink-soft">{article.agency_name}</p>
        <h2 className="mt-3 text-pretty text-2xl font-bold leading-snug text-ink sm:text-3xl">
          <a
            href={article.canonical_url}
            target="_blank"
            rel="noreferrer"
            className="after:absolute after:inset-0 group-hover:text-teal"
          >
            {article.title}
          </a>
        </h2>
        <p className="mt-4 mb-6 line-clamp-4 max-w-[65ch] text-[15px] leading-7 text-ink-soft lg:line-clamp-8">
          {excerpt(article.summary || article.body_text, image ? 220 : 600)}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-xs text-ink-soft">
          <span>{formatDate(article.published_at)}</span>
          <span className="inline-flex items-center gap-1 font-medium text-teal">
            อ่านต่อที่ต้นฉบับ
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Card>
  )
}
