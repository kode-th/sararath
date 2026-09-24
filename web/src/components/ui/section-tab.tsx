import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export function SectionTab({ className, children, ...props }: ComponentProps<'h2'>) {
  return (
    <h2 className={cn('border-b-2 border-foreground', className)} {...props}>
      <span className="inline-block bg-foreground px-2.5 font-display text-sm font-semibold leading-7 text-primary-foreground">
        {children}
      </span>
    </h2>
  )
}
