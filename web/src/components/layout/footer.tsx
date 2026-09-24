import { ArrowUpRight } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-16 border-t-2 border-foreground py-6 text-xs text-muted-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2">
          <img src="/logo.png" alt="" className="size-7" />
          <p className="leading-6">
            <span className="font-semibold text-foreground">สาระรัฐ</span> · ข่าวตรงจากเว็บไซต์หน่วยงานรัฐ
            <span className="block">
              ดำเนินการโดยอิสระ ไม่ได้สังกัดหน่วยงานรัฐใด ข่าวทุกชิ้นลิงก์กลับไปยังต้นฉบับ
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span>ดึงข่าวใหม่จากเว็บไซต์หน่วยงานทุก 1–2 ชั่วโมง</span>
          <a
            href="https://thai-gov-news-apis.onrender.com/reference"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-foreground hover:underline hover:decoration-highlight"
          >
            API สำหรับนักพัฒนา <ArrowUpRight aria-hidden="true" className="size-3" />
          </a>
        </div>
      </div>
    </footer>
  )
}
