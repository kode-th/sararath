import { Hono } from 'hono';
import { describeRoute, resolver } from 'hono-openapi';

import { getDb } from '../db/client';
import { listSources } from '../db/sources';
import type { Env } from '../env';
import { SourcesPageSchema } from '../schemas';

export const sourcesRoute = new Hono<{ Bindings: Env }>().get(
  '/',
  describeRoute({
    tags: ['ops'],
    summary: 'Configured sources',
    responses: {
      200: {
        description: 'Sources',
        content: { 'application/json': { schema: resolver(SourcesPageSchema) } },
      },
    },
  }),
  async (c) => {
    const items = await listSources(getDb(c.env));
    return c.json({ items }, 200);
  },
);
