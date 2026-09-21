import { useState, type SubmitEvent } from 'react'
import { useFeedCount } from '@/lib/feed-meta'

interface HeaderProps {
  onSearch: (q: string) => void
}

export function Header({ onSearch }: Readonly<HeaderProps>) {
  const [value, setValue] = useState('')
  const count = useFeedCount()

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch(value.trim())
  }

  return (
    <header className="sticky top-3 z-30 mx-auto max-w-6xl rounded-2xl border border-line bg-paper/85 shadow-lg shadow-ink/10 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
        <a href="/" className="mr-auto flex items-center gap-3">
          <img src="/logo.png" alt="สาระรัฐ" className="size-10 rounded-xl" />
          <span className="leading-tight">
            <strong className="block font-display text-[15px] text-ink">สาระรัฐ</strong>
            <span className="text-[11px] text-ink-soft">ข่าวจากหน่วยงานภาครัฐต้นทาง</span>
          </span>
        </a>
        <form
          onSubmit={submit}
          className="hidden items-center rounded-lg border border-line bg-paper px-3 sm:flex"
        >
          <label htmlFor="site-search" className="sr-only">
            ค้นหาข่าว
          </label>
          <input
            id="site-search"
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ค้นหาข่าวหรือหน่วยงาน"
            className="h-9 w-44 bg-transparent px-2 text-sm text-ink outline-none placeholder:text-ink-soft/60 md:w-60"
          />
        </form>
        {count !== undefined && (
          <span className="rounded-lg bg-primary/15 px-3 py-2 font-mono text-[10px] text-ink">
            {count} ข่าว
          </span>
        )}
      </div>
      <form
        onSubmit={submit}
        className="flex border-t border-line px-4 py-2 sm:hidden"
      >
        <label htmlFor="site-search-m" className="sr-only">
          ค้นหาข่าว
        </label>
        <input
          id="site-search-m"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ค้นหาข่าวหรือหน่วยงาน"
          className="h-8 min-w-0 flex-1 bg-transparent px-2 text-sm text-ink outline-none"
        />
      </form>
    </header>
  )
}
