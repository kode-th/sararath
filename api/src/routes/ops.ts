import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';

import { getDb } from '../db/client';
import { health } from '../db/health';
import { listRuns } from '../db/runs';
import { listSources } from '../db/sources';
import type { Env } from '../env';
import {
  ErrorSchema,
  HealthSchema,
  RunsPageSchema,
  runsQuerySchema,
  SourcesPageSchema,
} from '../schemas';

export const ops = new Hono<{ Bindings: Env }>()
  .get(
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
  )
  .get(
    '/sources',
    describeRoute({
      tags: ['ops'],
      summary: 'Configured sources',
      responses: {
        200: {
          description: 'Sources',
          content: {
            'application/json': { schema: resolver(SourcesPageSchema) },
          },
        },
      },
    }),
    async (c) => {
      const items = await listSources(getDb(c.env));
      return c.json({ items }, 200);
    },
  )
  .get(
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
