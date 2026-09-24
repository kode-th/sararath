import type { ArticleItem } from '@/lib/api'

export function formatDate(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'long',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value))
}

export function formatTime(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value))
}

export function leadImage(item: ArticleItem) {
  return (item.attachments ?? [])[0]
}

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replace(/\s+/g, ' ')
    .trim()
}

export function excerpt(value: string, length = 220) {
  const text = cleanText(value)
  return text.length > length ? `${text.slice(0, length).trim()}…` : text
}
