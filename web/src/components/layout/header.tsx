import { Link, useSearch } from '@tanstack/react-router';

import { SearchBox } from '@/components/filters/search-box';

export function Header() {
  const search = useSearch({ strict: false });

  return (
    <>
      <p className="bg-foreground px-4 py-1.5 text-center text-xs text-primary-foreground sm:px-8">
        <span className="hidden sm:inline">สาระรัฐเป็นแหล่งรวบรวมข่าวจากเว็บไซต์หน่วยงานรัฐ </span>
        <span>ไม่ใช่เว็บของทางราชการและไม่ได้สังกัดหน่วยงานใด</span>
      </p>
      <header className="sm:sticky sm:top-0 sm:z-10 sm:border-b sm:border-foreground/15 sm:bg-background">
        <div className="container flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 py-3 sm:py-4">
          <Link
            to="/"
            search={{ category: undefined, source: undefined, cursor: undefined }}
            className="mr-auto flex items-center gap-3"
          >
            <img src="/logo.svg" alt="" className="size-11" />
            <span className="leading-tight">
              <img src="/wordmark.svg" alt="สาระรัฐ" className="h-6 w-auto" />
              <span className="block text-xs text-muted-foreground">ข่าวหน่วยงานรัฐ รวมไว้ที่เดียว</span>
            </span>
          </Link>
          <Link
            to="/news"
            search={{ q: undefined, source: undefined, category: undefined }}
            className="font-display text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            ข่าวทั้งหมด
          </Link>
          <SearchBox key={search.q ?? ''} initialQuery={search.q} />
        </div>
      </header>
    </>
  );
}
