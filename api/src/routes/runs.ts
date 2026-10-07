import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';

import { getDb } from '../db/client';
import { listRuns } from '../db/runs';
import type { Env } from '../env';
import { RunsPageSchema, runsQuerySchema } from '../schemas';

export const runsRoute = new Hono<{ Bindings: Env }>().get(
  '/runs',
  describeRoute({
    tags: ['ops'],
    summary: 'Recent collector runs',
    responses: {
      200: {
        description: 'Runs, newest first',
        content: { 'application/json': { schema: resolver(RunsPageSchema) } },
      },
    },
  }),
  validator('query', runsQuerySchema, (result, c) => {
    if (result.success) return undefined;
    return c.json({ detail: 'limit must be 1..100' }, 422);
  }),
  async (c) => {
    const { source, limit } = c.req.valid('query');
    const items = await listRuns(getDb(c.env), source, limit);
    return c.json({ items }, 200);
  },
);
