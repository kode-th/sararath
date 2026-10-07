import { ArrowDown } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface LoadMoreProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

export function LoadMore({ hasMore, loading, onLoadMore }: Readonly<LoadMoreProps>) {
  if (!hasMore) return null;

  return (
    <Button onClick={onLoadMore} disabled={loading} className="mt-6 w-full">
      {loading ? (
        'กำลังโหลด…'
      ) : (
        <>
          โหลดข่าวเพิ่ม <ArrowDown aria-hidden="true" className="size-4" />
        </>
      )}
    </Button>
  );
}
