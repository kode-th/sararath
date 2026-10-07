export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Normalize a Postgres timestamp (Date or text) to an ISO-8601 UTC string. */
export function toIso(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString();

  // Postgres text offsets may omit the minutes (`+00` or `+0000`); JS needs `+00:00`.
  const text = value
    .replace(' ', 'T')
    .replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
    .replace(/([+-]\d{2})$/, '$1:00');
  const parsed = new Date(text);

  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}
