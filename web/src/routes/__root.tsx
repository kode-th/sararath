import { preloads } from '@pyyupsk/fonts/meta';
import { QueryClientProvider } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import type { PropsWithChildren } from 'react';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { NotFound } from '@/components/layout/not-found';
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/constants/site';

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
      { property: 'og:image', content: OG_IMAGE },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: SITE_TITLE },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: OG_IMAGE },
      { name: 'theme-color', content: '#123558' },
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
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          alternateName: 'Sararath',
          url: SITE_URL,
          inLanguage: 'th',
          description: SITE_DESCRIPTION,
        }),
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'สาระรัฐ (Sararath)',
          url: SITE_URL,
          logo: `${SITE_URL}/logo.svg`,
        }),
      },
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
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:border-2 focus:border-foreground focus:bg-card focus:px-4 focus:py-2 focus:font-display focus:text-sm focus:font-semibold focus:text-foreground"
      >
        ข้ามไปที่เนื้อหาหลัก
      </a>
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
