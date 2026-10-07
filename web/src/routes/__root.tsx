import { preloads } from '@pyyupsk/fonts/meta';
import { QueryClientProvider } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import type { PropsWithChildren } from 'react';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { NotFound } from '@/components/layout/not-found';

import appCss from '@/assets/css/styles.css?url';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'สาระรัฐ · ข่าวหน่วยงานรัฐ รวมไว้ที่เดียว' },
      { name: 'application-name', content: 'Sararath' },
      {
        name: 'description',
        content:
          'รวมข่าว ประกาศ และข้อมูลจากเว็บไซต์หน่วยงานรัฐไทยไว้ในที่เดียว ค้นหาและกรองตามหน่วยงานหรือหมวดหมู่ได้ พร้อมลิงก์กลับไปยังต้นฉบับ',
      },
      { property: 'og:site_name', content: 'สาระรัฐ (Sararath)' },
      { property: 'og:title', content: 'สาระรัฐ · ข่าวหน่วยงานรัฐ รวมไว้ที่เดียว' },
      {
        property: 'og:description',
        content:
          'รวมข่าว ประกาศ และข้อมูลจากเว็บไซต์หน่วยงานรัฐไทยไว้ในที่เดียว ค้นหาและกรองตามหน่วยงานหรือหมวดหมู่ได้ พร้อมลิงก์กลับไปยังต้นฉบับ',
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
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
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
      <Header />
      <Outlet />
      <Footer />
    </QueryClientProvider>
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
