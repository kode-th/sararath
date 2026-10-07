import { Link } from '@tanstack/react-router';

import { AgencyTabs } from '@/components/filters/agency-tabs';
import { CategorySelect } from '@/components/filters/category-select';
import type { CategoryItem, NewsSourceItem } from '@/lib/api';

interface FilterBarProps {
  sources: NewsSourceItem[];
  categories: CategoryItem[];
  source?: string;
  category?: string;
  q?: string;
  target: 'home' | 'search';
}

export function FilterBar({
  sources,
  categories,
  source,
  category,
  q,
  target,
}: Readonly<FilterBarProps>) {
  const showClear = target === 'search' && Boolean(q || source || category);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <AgencyTabs sources={sources} active={source} q={q} target={target} />
      <div className="flex items-center gap-4">
        {showClear && (
          <Link
            to="/news"
            search={{ q: undefined, source: undefined, category: undefined }}
            className="inline-flex min-h-11 items-center font-display text-sm font-semibold whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            ล้างตัวกรอง
          </Link>
        )}
        <CategorySelect
          categories={categories}
          source={source}
          active={category}
          q={q}
          target={target}
        />
      </div>
    </div>
  );
}
