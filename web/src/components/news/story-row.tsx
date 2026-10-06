import { cn } from '@/lib/cn';
import type { FeedItem } from '@/lib/format';
import { formatShortDate, formatTime, hideBrokenImage, leadImage } from '@/lib/format';

interface StoryRowProps {
  article: FeedItem;
  thumbnail?: boolean;
}

export function StoryRow({ article, thumbnail = false }: Readonly<StoryRowProps>) {
  const image = thumbnail ? leadImage(article) : undefined;
  return (
    <li className="border-b border-foreground/15">
      <a
        href={article.canonical_url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          'group grid gap-3 py-3 transition-colors duration-150 hover:bg-accent',
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
          <span className="line-clamp-2 font-display text-compact leading-6 font-semibold text-foreground group-hover:underline group-hover:decoration-highlight">
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
            onError={hideBrokenImage}
            className="aspect-square w-full border border-foreground/15 object-cover"
          />
        )}
      </a>
    </li>
  );
}
