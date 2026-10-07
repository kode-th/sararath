import { z } from 'zod';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Normalize a Postgres timestamp (Date, `2026-10-07 09:04:00+00`, or ISO) to an ISO-8601 UTC string. */
export function toIso(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'string') return null;
  const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

// Row shapes are validated at runtime so database results are never blindly asserted.
export const timestamp = z.unknown();
export const dbInt = z.coerce.number().int();
