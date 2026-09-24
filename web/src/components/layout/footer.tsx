import { ArrowUpRight } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-10 flex flex-col gap-3 border-t border-border py-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="" className="size-7 rounded-lg" />
        <span>สาระรัฐ · ข่าวตรงจากเว็บไซต์หน่วยงานรัฐ</span>
      </div>
      <div className="flex items-center gap-4 font-mono">
        <span>ดึงข่าวจากเว็บไซต์หน่วยงานโดยตรง</span>
        <a
          href="https://thai-gov-news-apis.onrender.com/reference"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          API <ArrowUpRight className="size-3" />
        </a>
      </div>
    </footer>
  )
}
