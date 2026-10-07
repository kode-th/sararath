import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { RotateCw } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

// The free API host sleeps when idle, so a failed first load is common.
export function FeedError({ reset }: Readonly<ErrorComponentProps>) {
  const router = useRouter();
  const queryReset = useQueryErrorResetBoundary();

  useEffect(() => {
    queryReset.reset();
  }, [queryReset]);

  return (
    <main id="content" className="container max-w-6xl py-16">
      <h1 className="text-title-md font-bold text-foreground sm:text-5xl">โหลดข่าวไม่สำเร็จ</h1>
      <p className="mt-3 max-w-[60ch] text-pretty text-muted-foreground">
        เซิร์ฟเวอร์ข่าวอาจกำลังเริ่มทำงานอยู่ ใช้เวลาประมาณหนึ่งนาที รอสักครู่แล้วกดลองใหม่
      </p>
      <Button
        onClick={() => {
          reset();
          void router.invalidate();
        }}
        className="mt-6"
      >
        <RotateCw aria-hidden="true" className="size-4" /> ลองใหม่
      </Button>
    </main>
  );
}
