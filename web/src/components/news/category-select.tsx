import { useNavigate } from '@tanstack/react-router';

import {
  SelectItem,
  SelectItemText,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CategoryItem } from '@/lib/api';

interface CategorySelectProps {
  categories: CategoryItem[];
  active?: string;
  source?: string;
  q?: string;
  target: 'home' | 'search';
}

export function CategorySelect({
  categories,
  active,
  source,
  q,
  target,
}: Readonly<CategorySelectProps>) {
  const navigate = useNavigate();
  const items = [
    { label: 'ทุกหมวดหมู่', value: null },
    ...categories.map((category) => ({
      label: `${category.value} (${category.count})`,
      value: category.value,
    })),
  ];

  return (
    <SelectRoot
      items={items}
      value={active ?? null}
      onValueChange={(value) => {
        const category = typeof value === 'string' ? value : undefined;
        if (target === 'search') {
          void navigate({ to: '/search', search: { q, category, source } });
        } else {
          void navigate({ to: '/', search: { category, source, cursor: undefined } });
        }
      }}
    >
      <SelectTrigger aria-label="กรองตามหมวดหมู่">
        <SelectValue />
      </SelectTrigger>
      <SelectPortal>
        <SelectPositioner sideOffset={4}>
          <SelectPopup>
            <SelectList>
              {items.map((item) => (
                <SelectItem key={item.value ?? 'all'} value={item.value}>
                  <SelectItemText>{item.label}</SelectItemText>
                </SelectItem>
              ))}
            </SelectList>
          </SelectPopup>
        </SelectPositioner>
      </SelectPortal>
    </SelectRoot>
  );
}
