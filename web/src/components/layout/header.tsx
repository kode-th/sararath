import { useState, type SubmitEvent } from 'react'

interface HeaderProps {
  onSearch: (q: string) => void
}

const NAV = ['ทั้งหมด', 'นโยบาย', 'เศรษฐกิจ', 'สาธารณสุข', 'ดิจิทัล', 'การค้า']

export function Header({ onSearch }: Readonly<HeaderProps>) {
  const [value, setValue] = useState('')

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch(value.trim())
  }

  return (
    <header>
      <div className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center px-5 py-1.5 text-[13px]">
          <span>รัฐบาลไทย · Government of Thailand</span>
          <span className="ml-auto">TH | EN</span>
        </div>
      </div>
      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
          <img src="/logo.png" alt="สาระรัฐ" className="h-10 w-10" />
          <div>
            <p className="font-semibold leading-tight text-ink">สาระรัฐ</p>
            <p className="text-[13px] text-ink-soft">ข่าวราชการไทยตรงจากต้นทาง</p>
          </div>
          <form onSubmit={submit} className="ml-auto hidden sm:block">
            <label htmlFor="site-search" className="sr-only">
              ค้นหาข่าว
            </label>
            <input
              id="site-search"
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="ค้นหาข่าว..."
              className="w-60 rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none placeholder:text-ink-soft/60 focus:border-ring"
            />
          </form>
        </div>
      </div>
      <nav aria-label="หมวดข่าว" className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5">
          {NAV.map((item) => (
            <span key={item} className="whitespace-nowrap px-4 py-2.5 text-[15px] text-ink-soft">
              {item}
            </span>
          ))}
        </div>
      </nav>
    </header>
  )
}
