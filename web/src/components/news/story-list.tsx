import { StoryRow } from '@/components/news/story-row';
import type { FeedItem } from '@/utils/format';

interface StoryListProps {
  items: FeedItem[];
  thumbnail?: boolean;
  className?: string;
}

export function StoryList({ items, thumbnail = false, className }: Readonly<StoryListProps>) {
  return (
    <ol className={className}>
      {items.map((article) => (
        <StoryRow key={article.id} article={article} thumbnail={thumbnail} />
      ))}
    </ol>
  );
}
