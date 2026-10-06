import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HeadContent, Link, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import type { PropsWithChildren } from 'react'
import appCss from '@/styles.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'สาระรัฐ · ข่าวตรงจากเว็บไซต์หน่วยงานรัฐ',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'stylesheet',
        href: '/fonts.css',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16.png',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  const { queryClient } = Route.useRouteContext()
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  )
}

function NotFound() {
  return (
    <main className="px-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">ไม่พบหน้าที่คุณต้องการ (404)</p>
      <p className="mt-4">
        <Link
          to="/"
          search={{ q: undefined, category: undefined, source: undefined, cursor: undefined }}
          className="underline"
        >
          กลับหน้าแรก
        </Link>
      </p>
    </main>
  )
}

function RootDocument({ children }: Readonly<PropsWithChildren>) {
  return (
    <html lang="th">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
