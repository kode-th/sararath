import { Search } from 'lucide-react';
import { useState, type SubmitEvent } from 'react';

import { Button } from '@/components/ui/button';

interface HeaderProps {
  onSearch: (q: string) => void;
}

export function Header({ onSearch }: Readonly<HeaderProps>) {
  const [value, setValue] = useState('');

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(value.trim());
  }

  return (
    <header>
      <p className="bg-foreground px-4 py-1.5 text-center text-xs text-primary-foreground sm:px-8">
        <span className="hidden sm:inline">สาระรัฐเป็นแหล่งรวบรวมข่าวจากเว็บไซต์หน่วยงานรัฐ </span>
        <span>ไม่ใช่เว็บของทางราชการและไม่ได้สังกัดหน่วยงานใด</span>
      </p>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-8 sm:py-4">
        <a
          href="/"
          aria-label="สาระรัฐ ข่าวหน่วยงานรัฐ รวมไว้ที่เดียว"
          className="mr-auto flex items-center gap-3"
        >
          <img src="/logo.png" alt="" className="size-11" />
          <span className="leading-tight">
            <strong className="block font-display text-xl font-bold text-foreground">สาระรัฐ</strong>
            <span className="text-xs text-muted-foreground">ข่าวหน่วยงานรัฐ รวมไว้ที่เดียว</span>
          </span>
        </a>
        <search className="w-full border-2 border-foreground bg-card sm:w-72">
          <form onSubmit={submit} className="flex items-center">
            <label htmlFor="site-search" className="sr-only">
              ค้นหาข่าว
            </label>
            <input
              id="site-search"
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="ค้นหาข่าวหรือหน่วยงาน"
              className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" aria-label="ค้นหา" variant="solid" size="icon">
              <Search aria-hidden="true" className="size-4" />
            </Button>
          </form>
        </search>
      </div>
    </header>
  );
}
