import { Hono } from 'hono';
import { describeRoute, resolver } from 'hono-openapi';

import { getDb } from '@api/db/client';
import { health } from '@api/db/queries/health';
import type { Env } from '@api/env';
import { ErrorSchema, HealthSchema } from '@api/schemas';

export const healthRoute = new Hono<{ Bindings: Env }>().get(
  '/',
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
