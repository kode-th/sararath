import { Link } from '@tanstack/react-router';
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
          'group grid gap-3 py-3 transition-colors duration-150 hover:bg-muted focus-visible:bg-muted',
          image ? 'grid-cols-[5rem_minmax(0,1fr)_4.5rem]' : 'grid-cols-[5rem_minmax(0,1fr)]',
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
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {article.agencies.join(' · ')}
          </span>
        </span>
        {image && (
          <img
            src={image}
            alt=""
            loading="lazy"
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
