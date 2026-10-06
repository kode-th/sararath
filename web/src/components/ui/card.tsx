import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export function Card({ className, ...props }: Readonly<ComponentProps<'div'>>) {
  return <div className={cn('border border-foreground/15 bg-card', className)} {...props} />;
}
