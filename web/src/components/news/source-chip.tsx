import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/cn'

interface SourceChipProps {
  slug: string
  name: string
  active: boolean
}

export function SourceChip({ slug, name, active }: Readonly<SourceChipProps>) {
  return (
    <Link
      to="/"
      search={{ q: undefined, category: undefined, source: active ? undefined : slug, cursor: undefined }}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'rounded-full border px-3 py-1 text-sm',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card/60 text-muted-foreground transition hover:border-secondary/50 hover:text-foreground',
      )}
    >
      {name}
    </Link>
  )
}
