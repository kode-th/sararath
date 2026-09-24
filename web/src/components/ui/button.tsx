import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export function Button({ className, type = 'button', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-6 text-sm font-medium text-foreground transition hover:border-secondary/50 hover:text-accent-foreground disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
