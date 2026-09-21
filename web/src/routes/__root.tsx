import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import type { PropsWithChildren } from 'react'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
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
        title: 'ข่าวภาครัฐไทย',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <main style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <p style={{ fontSize: '0.85rem', color: '#666' }}>404 — ไม่พบหน้านี้</p>
      <p style={{ marginTop: '1rem' }}>
        <Link to="/" style={{ textDecoration: 'underline' }}>
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
