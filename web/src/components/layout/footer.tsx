import { ArrowUpRight } from 'lucide-react';
import { env } from 'virtual:env/client';

export function Footer() {
  return (
    <footer className="container mt-16 max-w-6xl text-xs text-muted-foreground">
      <div className="flex flex-col gap-3 border-t-2 border-foreground py-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="" width={44} height={44} className="size-11" />
          <p className="leading-6">
            <span className="font-semibold text-foreground">สาระรัฐ </span>
            <span>· ข่าวหน่วยงานรัฐ รวมไว้ที่เดียว</span>
            <span className="block">
              ดำเนินการโดยอิสระ ไม่ได้สังกัดหน่วยงานรัฐใด และทุกรายการลิงก์กลับไปยังต้นฉบับ
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span>ดึงข่าวใหม่จากเว็บไซต์หน่วยงานรัฐประมาณทุก 1–2 ชั่วโมง</span>
          <a
            href={`${env.VITE_API_URL}/reference`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 py-1 font-semibold whitespace-nowrap text-foreground hover:underline hover:decoration-accent"
          >
            API สำหรับนักพัฒนา <ArrowUpRight aria-hidden="true" className="size-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
