import { ArrowDown } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface LoadMoreButtonProps {
  cursor: string | null;
  loading: boolean;
  onLoadMore: () => void;
}

export function LoadMoreButton({ cursor, loading, onLoadMore }: Readonly<LoadMoreButtonProps>) {
  if (!cursor) return null;

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
