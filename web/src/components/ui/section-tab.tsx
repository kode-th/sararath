import type { ComponentProps, PropsWithChildren } from 'react';

import { cn } from '@/lib/cn';

export function SectionTab({
  className,
  children,
  ...props
}: Readonly<PropsWithChildren<Omit<ComponentProps<'h2'>, 'children'>>>) {
  return (
    <h2 className={cn('border-b-2 border-foreground', className)} {...props}>
      <span className="inline-block bg-foreground px-2.5 font-display text-sm leading-7 font-semibold text-primary-foreground">
        {children}
      </span>
    </h2>
  );
}
