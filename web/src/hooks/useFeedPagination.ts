import { useState } from 'react';

import { LOAD_MORE_LIMIT } from '@/constants/feed';
import { fetchArticles, type ArticleItem, type ArticlesPage } from '@/lib/api';
import type { FeedSearch } from '@/utils/feed';
import { markDuplicates } from '@/utils/format';

export function useFeedPagination(page: ArticlesPage, search: FeedSearch) {
  const [extra, setExtra] = useState<ArticleItem[]>([]);
  const [cursor, setCursor] = useState(page.next_cursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const next = await fetchArticles({ ...search, cursor, limit: LOAD_MORE_LIMIT });
      setExtra((prev) => [...prev, ...next.items]);
      setCursor(next.next_cursor);
    } catch {
      setError('โหลดข่าวเพิ่มไม่สำเร็จ ลองกดอีกครั้ง');
    } finally {
      setLoadingMore(false);
    }
  }

  return {
    items: markDuplicates([...page.items, ...extra]),
    cursor,
    loadingMore,
    error,
    loadMore,
  };
}
