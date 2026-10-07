import { Link } from '@tanstack/react-router';
import { Image } from '@unpic/react';
import { ArrowRight } from 'lucide-react';

import { HighlightTitle } from '@/components/news/highlight-title';
import { cn } from '@/lib/cn';
import type { FeedItem } from '@/utils/format';
import { excerpt, formatDate, formatTime, hideBrokenImage, leadImage } from '@/utils/format';

export function LeadStory({ article }: Readonly<{ article: FeedItem }>) {
  const image = leadImage(article);
  return (
    <article
      className={cn(
        'group relative grid gap-x-6 gap-y-4',
        image && 'md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]',
      )}
    >
      <div className={cn(image && 'md:col-start-2')}>
        <h2 className="text-title-sm font-bold text-foreground sm:text-4xl sm:leading-tight lg:text-title-lg">
          <Link
            to="/articles/$id"
            params={{ id: article.id }}
            className="after:absolute after:inset-0 hover:underline hover:decoration-foreground"
          >
            <HighlightTitle text={article.title} />
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
        <Image
          src={image}
          alt=""
          width={1200}
          height={600}
          layout="constrained"
          decoding="async"
          onError={hideBrokenImage}
          className="aspect-2/1 w-full border border-foreground/15 object-cover md:col-start-1 md:row-span-2 md:row-start-1 md:aspect-auto md:h-full md:max-h-104"
        />
      )}
      <div className={cn('flex flex-col', image && 'md:col-start-2')}>
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
