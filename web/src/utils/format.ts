import type { ArticleItem } from '@/lib/api';

const thaiDate = new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'long',
  timeZone: 'Asia/Bangkok',
});

const thaiTime = new Intl.DateTimeFormat('th-TH', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Bangkok',
});

const thaiShortDate = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Bangkok',
});

export function formatDate(value: string | null) {
  if (!value) return '';
  return thaiDate.format(new Date(value));
}

export function formatTime(value: string | null) {
  if (!value) return '';
  return thaiTime.format(new Date(value));
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
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');
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
  return thaiShortDate.format(new Date(value));
}

export type FeedItem = ArticleItem & { agencies: string[]; duplicate: boolean };

// Agencies republish the same story, so the same title can appear from more than
// one source. Keep every row; flag repeats so each card can name its own source.
export function markDuplicates(items: ArticleItem[]): FeedItem[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = item.title.trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return items.map((item) => ({
    ...item,
    agencies: [item.agency_name],
    duplicate: (counts.get(item.title.trim()) ?? 0) > 1,
  }));
}

export function hideBrokenImage(event: { currentTarget: HTMLImageElement }) {
  event.currentTarget.hidden = true;
}
