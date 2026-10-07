import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';

import { attachmentsFor, getArticleRow, toArticle } from '../db/articles';
import { getDb } from '../db/client';
import { UUID_RE } from '../db/row';
import type { Env } from '../env';
import { articleIdParamSchema, ArticleSchema, ErrorSchema } from '../schemas';

export const articleRoute = new Hono<{ Bindings: Env }>().get(
  '/articles/:article_id',
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
