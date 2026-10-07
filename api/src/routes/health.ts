import { Hono } from 'hono';
import { describeRoute, resolver } from 'hono-openapi';

import { getDb } from '../db/client';
import { health } from '../db/health';
import type { Env } from '../env';
import { ErrorSchema, HealthSchema } from '../schemas';

export const healthRoute = new Hono<{ Bindings: Env }>().get(
  '/health',
  describeRoute({
    tags: ['ops'],
    summary: 'Health check',
    responses: {
      200: {
        description: 'Database reachable',
        content: { 'application/json': { schema: resolver(HealthSchema) } },
      },
      503: {
        description: 'Database unreachable',
        content: { 'application/json': { schema: resolver(ErrorSchema) } },
      },
    },
  }),
  async (c) => {
    const out = await health(getDb(c.env));
    if (!out) return c.json({ detail: 'db unreachable' }, 503);
    return c.json(out, 200);
  },
);
