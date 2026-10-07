import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';

import {
  attachmentsFor,
  type CursorRow,
  listArticleRows,
  resolveCursor,
  toArticle,
} from '../db/articles';
import { getDb } from '../db/client';
import { UUID_RE } from '../db/row';
import type { Env } from '../env';
import { ArticlesPageSchema, articlesQuerySchema, ErrorSchema } from '../schemas';

export const articlesRoute = new Hono<{ Bindings: Env }>().get(
  '/articles',
  describeRoute({
    tags: ['articles'],
    summary: 'List articles',
    responses: {
      200: {
        description: 'A page of articles',
        content: { 'application/json': { schema: resolver(ArticlesPageSchema) } },
      },
      422: {
        description: 'Bad limit, date, or cursor',
        content: { 'application/json': { schema: resolver(ErrorSchema) } },
      },
      404: {
        description: 'Cursor not found',
        content: { 'application/json': { schema: resolver(ErrorSchema) } },
      },
    },
  }),
  validator('query', articlesQuerySchema, (result, c) => {
    if (result.success) return undefined;
    const paths = new Set(
      result.error.map((issue) => {
        const segment = issue.path?.[0];
        return typeof segment === 'string' ? segment : '';
      }),
    );
    if (paths.has('limit')) {
      return c.json({ detail: 'limit must be 1..100' }, 422);
    }
    if (paths.has('published_from')) {
      return c.json({ detail: 'bad published_from, want YYYY-MM-DD' }, 422);
    }
    if (paths.has('published_to')) {
      return c.json({ detail: 'bad published_to, want YYYY-MM-DD' }, 422);
    }
    return c.json({ detail: 'invalid query' }, 422);
  }),
  async (c) => {
    const query = c.req.valid('query');
    const db = getDb(c.env);
    let marker: CursorRow | null = null;
    if (query.cursor) {
      if (!UUID_RE.test(query.cursor)) {
        return c.json({ detail: 'bad cursor' }, 422);
      }
      marker = await resolveCursor(db, query.cursor);
      if (!marker) return c.json({ detail: 'cursor not found' }, 404);
    }
    const rows = await listArticleRows(db, query, marker, query.limit + 1);
    const page = rows.slice(0, query.limit);
    const attachments = await attachmentsFor(
      db,
      page.map((row) => row.id),
    );
    return c.json(
      {
        items: page.map((row) => toArticle(row, attachments.get(row.id) ?? [])),
        next_cursor: rows.length > query.limit ? page[page.length - 1].id : null,
      },
      200,
    );
  },
);
