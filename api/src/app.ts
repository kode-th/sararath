import { Scalar } from '@scalar/hono-api-reference';
import { Hono } from 'hono';
import { describeRoute, openAPIRouteHandler, resolver, validator } from 'hono-openapi';
import { cors } from 'hono/cors';

import {
  attachmentsFor,
  getArticleRow,
  getSql,
  health,
  listArticleRows,
  listCategories,
  listRuns,
  listSources,
  resolveCursor,
  suggest,
  toArticle,
  UUID_RE,
} from './db';
import type { Env } from './env';
import {
  articleIdParamSchema,
  ArticleSchema,
  ArticlesPageSchema,
  articlesQuerySchema,
  CategoriesPageSchema,
  categoriesQuerySchema,
  ErrorSchema,
  HealthSchema,
  RunsPageSchema,
  runsQuerySchema,
  SourcesPageSchema,
  SuggestSchema,
  suggestQuerySchema,
} from './schemas';

export const documentation = {
  info: {
    title: 'Sararath',
    version: '1.0.0',
    description:
      'Read-only index of Thai government news. Not affiliated with any government agency.',
  },
};

const routes = new Hono<{ Bindings: Env }>()
  .get(
    '/v1/articles',
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
      const sql = getSql(c.env);
      let marker: { id: string; published_at: string | null } | null = null;
      if (query.cursor) {
        if (!UUID_RE.test(query.cursor)) {
          return c.json({ detail: 'bad cursor' }, 422);
        }
        marker = await resolveCursor(sql, query.cursor);
        if (!marker) return c.json({ detail: 'cursor not found' }, 404);
      }
      const rows = await listArticleRows(sql, query, marker, query.limit + 1);
      const page = rows.slice(0, query.limit);
      const attachments = await attachmentsFor(
        sql,
        page.map((row) => row.id),
      );
      return c.json(
        {
          items: page.map((row) => toArticle(row, attachments.get(row.id) ?? [])),
          next_cursor: rows.length > query.limit ? page[page.length - 1].id : null,
        },
        200,
      );
    },
  )
  .get(
    '/v1/articles/:article_id',
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
      const sql = getSql(c.env);
      const row = await getArticleRow(sql, article_id);
      if (!row) return c.json({ detail: 'article not found' }, 404);
      const attachments = await attachmentsFor(sql, [row.id]);
      return c.json(toArticle(row, attachments.get(row.id) ?? []), 200);
    },
  )
  .get(
    '/v1/categories',
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
      const items = await listCategories(getSql(c.env), source, q);
      return c.json({ items }, 200);
    },
  )
  .get(
    '/v1/suggest',
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
      return c.json(await suggest(getSql(c.env), q.trim(), limit), 200);
    },
  )
  .get(
    '/v1/runs',
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
      const items = await listRuns(getSql(c.env), source, limit);
      return c.json({ items }, 200);
    },
  )
  .get(
    '/v1/sources',
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
      const items = await listSources(getSql(c.env));
      return c.json({ items }, 200);
    },
  )
  .get(
    '/v1/health',
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
      const out = await health(getSql(c.env));
      if (!out) return c.json({ detail: 'db unreachable' }, 503);
      return c.json(out, 200);
    },
  );

const app = new Hono<{ Bindings: Env }>()
  .use(
    '*',
    cors({
      origin: (_origin, c) => {
        const allowed = c.env.CORS_ORIGINS ?? '*';
        return allowed === '*' ? '*' : allowed.split(',');
      },
      allowMethods: ['GET'],
      allowHeaders: ['*'],
    }),
  )
  .route('/', routes)
  .get('/openapi.json', openAPIRouteHandler(routes, { documentation }))
  .get('/reference', Scalar({ url: '/openapi.json' }))
  .onError((err, c) => {
    console.error(
      JSON.stringify({
        level: 'error',
        path: c.req.path,
        message: err instanceof Error ? err.message : String(err),
      }),
    );
    return c.json({ detail: 'internal error' }, 500);
  });

export default app;
export type AppType = typeof app;

export type {
  ArticleOut,
  ArticlesPage,
  CategoryOut,
  RunOut,
  SourceOut,
  SuggestOut,
} from './schemas';
