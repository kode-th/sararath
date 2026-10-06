import { preloads } from '@pyyupsk/fonts/meta';
import { QueryClientProvider } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import type { PropsWithChildren } from 'react';

import appCss from '@/assets/css/styles.css?url';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'สาระรัฐ · ข่าวหน่วยงานรัฐ รวมไว้ที่เดียว' },
      {
        name: 'description',
        content: 'รวมข่าว ประกาศ และข้อมูลจากเว็บไซต์หน่วยงานรัฐไทยไว้ในที่เดียว พร้อมลิงก์กลับไปยังต้นฉบับ',
      },
      { property: 'og:site_name', content: 'สาระรัฐ' },
      { property: 'og:title', content: 'สาระรัฐ · ข่าวหน่วยงานรัฐ รวมไว้ที่เดียว' },
      {
        property: 'og:description',
        content: 'รวมข่าว ประกาศ และข้อมูลจากเว็บไซต์หน่วยงานรัฐไทยไว้ในที่เดียว พร้อมลิงก์กลับไปยังต้นฉบับ',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'theme-color', content: '#172033' },
    ],
    links: [
      ...preloads.map((preload) => ({
        rel: 'preload',
        as: 'font',
        type: preload.type,
        href: preload.href,
        crossOrigin: 'anonymous' as const,
      })),
      { rel: 'stylesheet', href: appCss },
      { rel: 'stylesheet', href: '/fonts.css' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

function NotFound() {
  return (
    <main className="container py-16 text-center">
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
  );
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
  );
}
