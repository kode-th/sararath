import { Hono } from 'hono';
import { describeRoute, resolver } from 'hono-openapi';

import { getDb } from '@api/db/client';
import { listSources } from '@api/db/queries/sources';
import type { Env } from '@api/env';
import { SourcesPageSchema } from '@api/schemas';

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
