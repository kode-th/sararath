import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

import type { FeedItem } from '@/utils/format';
import { excerpt, formatDate, formatTime, hideBrokenImage, leadImage } from '@/utils/format';

export function LeadStory({ article }: Readonly<{ article: FeedItem }>) {
  const image = leadImage(article);
  return (
    <article className="group relative grid gap-x-6 gap-y-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="md:col-start-2">
        <h2 className="text-title-sm font-bold text-foreground sm:text-4xl sm:leading-tight lg:text-title-lg">
          <Link
            to="/articles/$id"
            params={{ id: article.id }}
            className="after:absolute after:inset-0 hover:underline hover:decoration-foreground"
          >
            <span className="highlight motion-safe:animate-highlight-sweep">{article.title}</span>
          </Link>
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{article.agencies.join(' · ')}</span>
          {' · '}
          <time dateTime={article.published_at ?? undefined}>
            {formatDate(article.published_at)}
          </time>
        </p>
      </div>
      {image && (
        <img
          src={image}
          alt=""
          onError={hideBrokenImage}
          className="aspect-2/1 w-full border border-foreground/15 object-cover md:col-start-1 md:row-span-2 md:row-start-1 md:aspect-auto md:h-full md:max-h-104"
        />
      )}
      <div className="flex flex-col md:col-start-2">
        <p className="line-clamp-4 hidden max-w-[62ch] text-base text-muted-foreground sm:block">
          {excerpt(article.summary || article.body_text, 320)}
        </p>
        <p className="mt-auto flex items-center gap-1 pt-4 font-display text-sm font-semibold text-foreground">
          <span>อ่านรายละเอียด</span>
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:translate-none"
          />
          {article.retrieved_at && (
            <span className="ml-auto font-sans text-xs font-normal text-muted-foreground">
              ดึงข่าวเมื่อ {formatTime(article.retrieved_at)} น.
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
