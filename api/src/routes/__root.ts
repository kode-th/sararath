import { Hono } from 'hono';

import type { Env } from '@api/env';

import { articlesRoute } from './articles';
import { categoriesRoute } from './categories';
import { healthRoute } from './health';
import { runsRoute } from './runs';
import { sourcesRoute } from './sources';
import { suggestRoute } from './suggest';

// Each sub-app is mounted at its resource prefix; `index.ts` owns the `/v1` base.
export const routes = new Hono<{ Bindings: Env }>()
  .route('/articles', articlesRoute)
  .route('/categories', categoriesRoute)
  .route('/suggest', suggestRoute)
  .route('/runs', runsRoute)
  .route('/sources', sourcesRoute)
  .route('/health', healthRoute);
