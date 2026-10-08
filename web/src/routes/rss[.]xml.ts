import { createFileRoute } from '@tanstack/react-router';

import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '@/constants/site';
import { fetchArticles, type ArticleItem } from '@/lib/api';
import { slugify } from '@/utils/slug';

const MAX_ITEMS = 50;

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function renderItem(origin: string, item: ArticleItem) {
  const link = [origin, 'articles', item.id, slugify(item.title)].filter(Boolean).join('/');
  const pubDate = item.published_at
    ? `\n      <pubDate>${new Date(item.published_at).toUTCString()}</pubDate>`
    : '';
  const description = item.summary
    ? `\n      <description>${escapeXml(item.summary)}</description>`
    : '';
  return `    <item>\n      <title>${escapeXml(item.title)}</title>\n      <link>${escapeXml(link)}</link>\n      <guid isPermaLink="true">${escapeXml(link)}</guid>${pubDate}${description}\n    </item>`;
}

export const Route = createFileRoute('/rss.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        let items = '';
        try {
          const page = await fetchArticles({ limit: MAX_ITEMS });
          items = page.items.map((item) => renderItem(origin, item)).join('\n');
        } catch {
          // API unreachable: still serve a valid, empty feed.
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${escapeXml(SITE_TITLE)}</title>\n    <link>${SITE_URL}/</link>\n    <description>${escapeXml(SITE_DESCRIPTION)}</description>\n    <language>th</language>\n${items}\n  </channel>\n</rss>\n`;
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=1800',
          },
        });
      },
    },
  },
});
