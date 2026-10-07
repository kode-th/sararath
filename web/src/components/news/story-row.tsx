import { Link } from '@tanstack/react-router';
import { Image } from '@unpic/react';
import { useState } from 'react';

import { cn } from '@/lib/cn';
import type { FeedItem } from '@/utils/format';
import { formatShortDate, formatTime, hideBrokenImage, leadImage } from '@/utils/format';

interface StoryRowProps {
  article: FeedItem;
  thumbnail?: boolean;
}

export function StoryRow({ article, thumbnail = false }: Readonly<StoryRowProps>) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const image = thumbnail ? leadImage(article) : undefined;

  return (
    <li className="border-b border-foreground/15">
      <Link
        to="/articles/$id"
        params={{ id: article.id }}
        className={cn(
          'group grid h-full gap-3 py-3 transition-colors duration-150 hover:bg-accent/40 focus-visible:bg-accent/40',
          image ? 'grid-cols-[3.5rem_minmax(0,1fr)_4.5rem]' : 'grid-cols-[3.5rem_minmax(0,1fr)]',
        )}
      >
        <time dateTime={article.published_at ?? undefined} className="leading-tight">
          <span className="block text-sm font-semibold text-foreground">
            {formatTime(article.published_at) || '—'}
          </span>
          <span className="block text-xs text-muted-foreground">
            {formatShortDate(article.published_at)}
          </span>
        </time>
        <span className="min-w-0">
          <span className="line-clamp-2 font-display text-compact leading-6 font-semibold text-foreground group-hover:underline group-hover:decoration-accent">
            {article.title}
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            {article.duplicate ? (
              <span className="shrink-0 border border-foreground/25 px-1 font-semibold text-foreground">
                {article.source.name_th}
              </span>
            ) : (
              <span className="truncate">{article.agencies.join(' · ')}</span>
            )}
          </span>
        </span>
        {image && (
          <Image
            src={image}
            alt=""
            width={72}
            height={72}
            layout="fixed"
            loading="lazy"
            decoding="async"
            ref={(node) => {
              if (node?.complete && node.naturalWidth > 0) setImageLoaded(true);
            }}
            onLoad={() => setImageLoaded(true)}
            onError={hideBrokenImage}
            className={cn(
              'aspect-square w-full border object-cover',
              imageLoaded ? 'border-foreground/15' : 'border-transparent',
            )}
          />
        )}
      </Link>
    </li>
  );
}
