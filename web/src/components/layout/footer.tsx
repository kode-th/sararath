import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { env } from 'virtual:env/client';

export function Footer() {
  return (
    <footer className="container mt-auto max-w-6xl pt-16 text-xs text-muted-foreground">
      <div className="border-t-2 border-foreground py-6 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-x-8">
        <div className="flex items-end gap-2 lg:col-start-1 lg:row-start-1">
          <img src="/logo.svg" alt="" width={44} height={44} className="size-11" />
          <p className="leading-6">
            <span className="font-semibold text-foreground">สาระรัฐ · </span>
            <span>ข่าวหน่วยงานรัฐ รวมไว้ที่เดียว</span>
          </p>
        </div>
        <p className="mt-1 leading-6 lg:col-span-2 lg:row-start-2">
          ดำเนินการโดยอิสระ ไม่ได้สังกัดหน่วยงานรัฐใด และทุกรายการลิงก์กลับไปยังต้นฉบับ
        </p>
        <div className="mt-3 flex items-center gap-4 lg:col-start-2 lg:row-start-1 lg:mt-0 lg:items-end">
          <span>ดึงข่าวใหม่จากเว็บไซต์หน่วยงานรัฐประมาณทุก 1–2 ชั่วโมง</span>
          <Link
            to="/policy"
            className="inline-flex min-h-11 items-center font-semibold whitespace-nowrap text-foreground hover:underline hover:decoration-accent lg:min-h-0"
          >
            นโยบายและแหล่งข่าว
          </Link>
          <a
            href={`${env.VITE_API_URL}/docs`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1 font-semibold whitespace-nowrap text-foreground hover:underline hover:decoration-accent lg:min-h-0"
          >
            API สำหรับนักพัฒนา <ArrowUpRight aria-hidden="true" className="size-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
