import { Link } from '@tanstack/react-router'

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
      className={
        active
          ? 'rounded-full border border-ink bg-ink px-3 py-1 text-sm text-paper'
          : 'rounded-full border border-line bg-paper/60 px-3 py-1 text-sm text-ink-soft transition hover:border-teal/50 hover:text-ink'
      }
    >
      {name}
    </Link>
  )
}
