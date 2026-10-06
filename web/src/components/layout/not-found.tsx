import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';

export function NotFound() {
  return (
    <main className="container grid max-w-3xl grow place-items-center py-20 sm:py-28">
      <div className="text-center">
        <p className="font-display text-6xl leading-none font-bold text-foreground sm:text-7xl">
          <span className="highlight">404</span>
        </p>
        <h1 className="mt-8 text-title-md font-bold text-foreground sm:text-4xl">
          ไม่พบหน้าที่คุณต้องการ
        </h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-pretty text-muted-foreground">
          หน้านี้อาจถูกย้ายหรือลบไปแล้ว กลับไปที่หน้าแรกเพื่อดูข่าวล่าสุดจากหน่วยงานรัฐ
        </p>
        <Link
          to="/"
          search={{ category: undefined, source: undefined, cursor: undefined }}
          className={buttonVariants({ className: 'mt-8' })}
        >
          <ArrowLeft aria-hidden="true" className="size-4" /> กลับหน้าแรก
        </Link>
      </div>
    </main>
  );
}
