import { ArrowUpRight } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-10 flex flex-col gap-3 border-t border-line py-6 text-[11px] text-ink-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="" className="size-7 rounded-lg" />
        <span>สาระรัฐ · ข่าวจากหน่วยงานภาครัฐต้นทาง</span>
      </div>
      <div className="flex items-center gap-4 font-mono">
        <span>อัปเดตตามแหล่งเผยแพร่</span>
        <a
          href="https://thai-gov-news-apis.onrender.com/reference"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-ink"
        >
          API <ArrowUpRight className="size-3" />
        </a>
      </div>
    </footer>
  )
}
