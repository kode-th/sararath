import { createFileRoute } from '@tanstack/react-router';

import { fetchArticles } from '@/lib/api';
import { slugify } from '@/utils/slug';

const STATIC_PATHS = ['/', '/news', '/policy'];
const MAX_ARTICLES = 500;
const PAGE_SIZE = 100;

type SitemapEntry = Readonly<{ loc: string; lastmod?: string }>;

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function render(entries: readonly SitemapEntry[]) {
  const urls = entries
    .map(({ loc, lastmod }) =>
      lastmod
        ? `  <url><loc>${escapeXml(loc)}</loc><lastmod>${escapeXml(lastmod)}</lastmod></url>`
        : `  <url><loc>${escapeXml(loc)}</loc></url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function articleEntries(origin: string): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];
  let cursor: string | undefined;
  while (entries.length < MAX_ARTICLES) {
    // Cursor paging is sequential: each page needs the previous next_cursor.
    // oxlint-disable-next-line no-await-in-loop
    const page = await fetchArticles({ limit: PAGE_SIZE, cursor });
    for (const item of page.items) {
      const slug = slugify(item.title);
      entries.push({
        loc: [origin, 'articles', item.id, slug].filter(Boolean).join('/'),
        ...(item.published_at ? { lastmod: item.published_at } : {}),
      });
    }
    if (!page.next_cursor) break;
    cursor = page.next_cursor;
  }
  return entries.slice(0, MAX_ARTICLES);
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const staticEntries: SitemapEntry[] = STATIC_PATHS.map((path) => ({
          loc: `${origin}${path}`,
        }));
        let entries = staticEntries;
        try {
          entries = [...staticEntries, ...(await articleEntries(origin))];
        } catch {
          // API unreachable: still serve the static pages.
        }
        return new Response(render(entries), {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      },
    },
  },
});
