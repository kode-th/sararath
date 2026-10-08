import type { PropsWithChildren } from 'react';

import { SectionTab } from '@/components/ui/section-tab';

export function Section({
  id,
  title,
  children,
}: Readonly<PropsWithChildren<{ id: string; title: string }>>) {
  return (
    <section aria-labelledby={id} className="mt-10">
      <SectionTab id={id}>{title}</SectionTab>
      <div className="mt-4 space-y-4 leading-7 text-pretty text-foreground">{children}</div>
    </section>
  );
}
