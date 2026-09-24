import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export function Button({ className, type = 'button', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-paper px-6 text-sm font-medium text-ink transition hover:border-teal/50 hover:text-teal disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
