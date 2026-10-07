import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';

import { getDb } from '@api/db/client';
import { suggest } from '@api/db/queries/suggest';
import type { Env } from '@api/env';
import { SuggestSchema, suggestQuerySchema } from '@api/schemas';

export const suggestRoute = new Hono<{ Bindings: Env }>().get(
  '/',
  describeRoute({
    tags: ['articles'],
    summary: 'Suggest sources and articles for a query',
    responses: {
      200: {
        description: 'Suggestions',
        content: { 'application/json': { schema: resolver(SuggestSchema) } },
      },
    },
  }),
  validator('query', suggestQuerySchema, (result, c) => {
    if (result.success) return undefined;
    return c.json({ detail: 'limit must be 1..20' }, 422);
  }),
  async (c) => {
    const { q, limit } = c.req.valid('query');
    return c.json(await suggest(getDb(c.env), q.trim(), limit), 200);
  },
);
