import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';

import { getDb } from '@api/db/client';
import {
  attachmentsFor,
  type CursorRow,
  getArticleRow,
  listArticleRows,
  resolveCursor,
  toArticle,
} from '@api/db/queries/articles';
import { UUID_RE } from '@api/db/row';
import type { Env } from '@api/env';
import {
  articleIdParamSchema,
  ArticleSchema,
  ArticlesPageSchema,
  articlesQuerySchema,
  ErrorSchema,
} from '@api/schemas';

export const articlesRoute = new Hono<{ Bindings: Env }>()
  .get(
    '/',
    describeRoute({
      tags: ['articles'],
      summary: 'List articles',
      responses: {
        200: {
          description: 'A page of articles',
          content: {
            'application/json': { schema: resolver(ArticlesPageSchema) },
          },
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
          next_cursor: rows.length > query.limit ? (page.at(-1)?.id ?? null) : null,
        },
        200,
      );
    },
  )
  .get(
    '/:article_id',
    describeRoute({
      tags: ['articles'],
      summary: 'Get one article',
      responses: {
        200: {
          description: 'The article',
          content: { 'application/json': { schema: resolver(ArticleSchema) } },
        },
        422: {
          description: 'Bad article id',
          content: { 'application/json': { schema: resolver(ErrorSchema) } },
        },
        404: {
          description: 'Article not found',
          content: { 'application/json': { schema: resolver(ErrorSchema) } },
        },
      },
    }),
    validator('param', articleIdParamSchema, (result, c) => {
      if (result.success) return undefined;
      return c.json({ detail: 'bad article id' }, 422);
    }),
    async (c) => {
      const { article_id } = c.req.valid('param');
      if (!UUID_RE.test(article_id)) {
        return c.json({ detail: 'bad article id' }, 422);
      }
      const db = getDb(c.env);
      const row = await getArticleRow(db, article_id);
      if (!row) return c.json({ detail: 'article not found' }, 404);
      const attachments = await attachmentsFor(db, [row.id]);
      return c.json(toArticle(row, attachments.get(row.id) ?? []), 200);
    },
  );
