import type { ArticleItem } from '@/lib/api';

export function formatDate(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'long',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value));
}

export function formatTime(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value));
}

export function leadImage(item: ArticleItem) {
  return (item.attachments ?? [])[0];
}

// `[^<>]` (not `[^>]`) keeps matching linear: a negated class that excludes `<`
// can't cross another tag start, so runs scanned per `<` are disjoint.
function stripMarkup(value: string) {
  return value
    .replace(/<[^<>]*>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function cleanText(value: string) {
  return stripMarkup(value).replace(/\s+/g, ' ').trim();
}

// Article bodies keep their paragraph breaks, so only collapse each line's padding.
export function plainText(value: string) {
  return stripMarkup(value)
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

export function excerpt(value: string, length = 220) {
  const text = cleanText(value);
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}

export function formatShortDate(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value));
}

export type FeedItem = ArticleItem & { agencies: string[] };

// Agencies often publish the same story; keep one row and name every publisher.
export function mergeDuplicates(items: ArticleItem[]): FeedItem[] {
  const byTitle = new Map<string, FeedItem>();
  for (const item of items) {
    const key = item.title.trim();
    const seen = byTitle.get(key);
    if (!seen) byTitle.set(key, { ...item, agencies: [item.agency_name] });
    else if (!seen.agencies.includes(item.agency_name)) seen.agencies.push(item.agency_name);
  }
  return [...byTitle.values()];
}

export function hideBrokenImage(event: { currentTarget: HTMLImageElement }) {
  event.currentTarget.hidden = true;
}
