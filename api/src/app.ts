import { Scalar } from '@scalar/hono-api-reference';
import { Hono } from 'hono';
import { openAPIRouteHandler } from 'hono-openapi';
import { cors } from 'hono/cors';

import type { Env } from './env';
import { articles } from './routes/articles';
import { ops } from './routes/ops';

const documentation = {
  info: {
    title: 'Sararath',
    version: '1.0.0',
    description:
      'Read-only index of Thai government news. Not affiliated with any government agency.',
  },
};

// Grouped sub-apps are merged with `.route()` so RPC types stay intact.
const routes = new Hono<{ Bindings: Env }>().route('/v1', articles).route('/v1', ops);

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
  .get('/reference', Scalar({ url: '/openapi.json', pageTitle: 'Sararath API' }))
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
