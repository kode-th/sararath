import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';

import { getDb } from '../db/client';
import { listCategories } from '../db/queries/categories';
import type { Env } from '../env';
import { CategoriesPageSchema, categoriesQuerySchema } from '../schemas';

export const categoriesRoute = new Hono<{ Bindings: Env }>().get(
  '/',
  describeRoute({
    tags: ['articles'],
    summary: 'List categories with counts',
    responses: {
      200: {
        description: 'Categories scoped by source and q',
        content: {
          'application/json': { schema: resolver(CategoriesPageSchema) },
        },
      },
    },
  }),
  validator('query', categoriesQuerySchema),
  async (c) => {
    const { source, q } = c.req.valid('query');
    const items = await listCategories(getDb(c.env), source, q);
    return c.json({ items }, 200);
  },
);
