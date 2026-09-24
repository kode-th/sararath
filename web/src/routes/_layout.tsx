import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

export const Route = createFileRoute('/_layout')({
  component: Layout,
})

function Layout() {
  const navigate = useNavigate()
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative min-h-screen bg-background text-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 opacity-70 bg-[radial-gradient(circle_at_8%_5%,color-mix(in_oklab,var(--color-secondary)_48%,transparent)_0,transparent_31%),radial-gradient(circle_at_92%_12%,color-mix(in_oklab,var(--color-primary)_12%,transparent)_0,transparent_34%),radial-gradient(color-mix(in_oklab,var(--color-foreground)_20%,transparent)_1px,transparent_1px)] bg-size-[auto,auto,24px_24px]"
        />
        <div className="relative z-10">
          <Header
            onSearch={(q) =>
              navigate({
                to: '/',
                search: { q: q || undefined, category: undefined, source: undefined, cursor: undefined },
              })
            }
          />
          <Outlet />
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <Footer />
          </div>
        </div>
      </div>
    </QueryClientProvider>
  )
}
