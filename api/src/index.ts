import { Scalar } from '@scalar/hono-api-reference';
import { Hono } from 'hono';
import { openAPIRouteHandler } from 'hono-openapi';
import { cors } from 'hono/cors';

import type { Env } from '@api/env';
import { routes } from '@api/routes/__root';

const base = new Hono<{ Bindings: Env }>()
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
  .route('/v1', routes);

const app = base
  // Generate the schema from `base` so documented paths keep the `/v1` prefix.
  .get(
    '/openapi.json',
    openAPIRouteHandler(base, {
      documentation: {
        info: {
          title: 'Sararath',
          version: '1.0.0',
          description:
            'Read-only index of Thai government news. Not affiliated with any government agency.',
        },
      },
    }),
  )
  .get('/docs', Scalar({ url: '/openapi.json', pageTitle: 'Sararath API' }))
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
