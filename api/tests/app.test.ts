import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import app from '@api/index';

const mocks = vi.hoisted(() => ({
  listArticleRows: vi.fn(),
  getArticleRow: vi.fn(),
  resolveCursor: vi.fn(),
  attachmentsFor: vi.fn(),
  toArticle: vi.fn(),
  listCategories: vi.fn(),
  suggest: vi.fn(),
  listRuns: vi.fn(),
  listSources: vi.fn(),
  health: vi.fn(),
}));

vi.mock('@api/db/client', () => ({ getDb: () => ({}) }));
vi.mock('@api/db/queries/articles', () => ({
  listArticleRows: mocks.listArticleRows,
  getArticleRow: mocks.getArticleRow,
  resolveCursor: mocks.resolveCursor,
  attachmentsFor: mocks.attachmentsFor,
  toArticle: mocks.toArticle,
}));
vi.mock('@api/db/queries/categories', () => ({
  listCategories: mocks.listCategories,
}));
vi.mock('@api/db/queries/suggest', () => ({ suggest: mocks.suggest }));
vi.mock('@api/db/queries/runs', () => ({ listRuns: mocks.listRuns }));
vi.mock('@api/db/queries/sources', () => ({ listSources: mocks.listSources }));
vi.mock('@api/db/queries/health', () => ({ health: mocks.health }));

const env = { DATABASE_URL: 'postgresql://u:p@host/db', CORS_ORIGINS: '*' };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.attachmentsFor.mockResolvedValue(new Map());
  mocks.toArticle.mockImplementation((row: { id: string }) => ({
    id: row.id,
    source: { slug: 's', name_th: 'S' },
    title: 't',
  }));
});

describe('articles', () => {
  it('lists a page', async () => {
    mocks.listArticleRows.mockResolvedValue([{ id: 'a' }]);
    const res = await app.request('/v1/articles', undefined, env);
    expect(res.status).toBe(200);
    const body = z
      .object({ items: z.array(z.unknown()), next_cursor: z.string().nullable() })
      .parse(await res.json());
    expect(body.items).toHaveLength(1);
    expect(body.next_cursor).toBeNull();
  });

  it('rejects a bad limit', async () => {
    const res = await app.request('/v1/articles?limit=999', undefined, env);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ detail: 'limit must be 1..100' });
  });

  it('rejects a malformed cursor', async () => {
    const res = await app.request('/v1/articles?cursor=nope', undefined, env);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ detail: 'bad cursor' });
  });

  it('422s a bad article id', async () => {
    const res = await app.request('/v1/articles/nope', undefined, env);
    expect(res.status).toBe(422);
  });

  it('404s an unknown article', async () => {
    mocks.getArticleRow.mockResolvedValue(null);
    const res = await app.request(
      '/v1/articles/11111111-1111-1111-1111-111111111111',
      undefined,
      env,
    );
    expect(res.status).toBe(404);
  });
});

describe('ops', () => {
  it('reports healthy', async () => {
    mocks.health.mockResolvedValue({ db: 'ok', sources: [] });
    const res = await app.request('/v1/health', undefined, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ db: 'ok', sources: [] });
  });

  it('503s when the database is unreachable', async () => {
    mocks.health.mockResolvedValue(null);
    const res = await app.request('/v1/health', undefined, env);
    expect(res.status).toBe(503);
  });

  it('lists sources', async () => {
    mocks.listSources.mockResolvedValue([]);
    const res = await app.request('/v1/sources', undefined, env);
    expect(res.status).toBe(200);
  });

  it('rejects a bad runs limit', async () => {
    const res = await app.request('/v1/runs?limit=0', undefined, env);
    expect(res.status).toBe(422);
  });
});

describe('docs and CORS', () => {
  it('serves the OpenAPI document with /v1 paths', async () => {
    const res = await app.request('/openapi.json', undefined, env);
    expect(res.status).toBe(200);
    const spec = z.object({ paths: z.record(z.string(), z.unknown()) }).parse(await res.json());
    expect(Object.keys(spec.paths)).toContain('/v1/articles');
  });

  it('adds the CORS header', async () => {
    const res = await app.request(
      '/v1/health',
      { headers: { Origin: 'https://example.dev' } },
      env,
    );
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });
});
