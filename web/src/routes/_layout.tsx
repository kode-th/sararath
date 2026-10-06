import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

export const Route = createFileRoute('/_layout')({
  component: Layout,
})

function Layout() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
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
  )
}