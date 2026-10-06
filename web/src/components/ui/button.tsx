import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export function Button({ className, type = 'button', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 border-2 border-foreground bg-card px-6 font-display text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-foreground hover:text-primary-foreground disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}
