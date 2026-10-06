import { Link } from '@tanstack/react-router';

import { cn } from '@/lib/cn';

interface AgencyTabsProps {
  sources: { slug: string; name_th: string }[];
  active?: string;
  q?: string;
}

export function AgencyTabs({ sources, active, q }: Readonly<AgencyTabsProps>) {
  const tabs = [{ slug: undefined, name_th: 'ทุกหน่วยงาน' }, ...sources];

  return (
    <nav aria-label="กรองตามหน่วยงาน" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max items-end gap-1 border-b-2 border-foreground">
        {tabs.map((tab) => {
          const current = tab.slug === active;
          const className = cn(
            'block px-3 font-display text-sm font-semibold transition-colors duration-150',
            current
              ? 'bg-accent py-2 text-foreground'
              : 'bg-muted py-1.5 text-muted-foreground hover:bg-accent/40 hover:text-foreground',
          );
          return (
            <li key={tab.slug ?? 'all'}>
              {q === undefined ? (
                <Link
                  to="/"
                  search={{ category: undefined, source: tab.slug, cursor: undefined }}
                  aria-current={current ? 'page' : undefined}
                  className={className}
                >
                  {tab.name_th}
                </Link>
              ) : (
                <Link
                  to="/search"
                  search={{ q, source: tab.slug }}
                  aria-current={current ? 'page' : undefined}
                  className={className}
                >
                  {tab.name_th}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
