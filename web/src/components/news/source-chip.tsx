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
          ? 'border-ink bg-ink text-paper'
          : 'border-line bg-paper/60 text-ink-soft transition hover:border-teal/50 hover:text-ink',
      )}
    >
      {name}
    </Link>
  )
}
