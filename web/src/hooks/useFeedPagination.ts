import { useInfiniteQuery } from '@tanstack/react-query';

import type { ArticlesPage } from '@/lib/api';
import { feedInfiniteQuery, type FeedSearch } from '@/utils/feed';
import { markDuplicates } from '@/utils/format';

export function useFeedPagination(page: ArticlesPage, search: FeedSearch) {
  const query = useInfiniteQuery({
    ...feedInfiniteQuery(search),
    initialData: { pages: [page], pageParams: [undefined] },
  });

  return {
    items: markDuplicates(query.data.pages.flatMap((p) => p.items)),
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    error: query.isFetchNextPageError ? 'โหลดข่าวเพิ่มไม่สำเร็จ ลองกดอีกครั้ง' : '',
    loadMore: () => {
      void query.fetchNextPage();
    },
  };
}
