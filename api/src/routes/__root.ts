import { Hono } from 'hono';

import type { Env } from '../env';
import { articleRoute } from './article';
import { articlesRoute } from './articles';
import { categoriesRoute } from './categories';
import { healthRoute } from './health';
import { runsRoute } from './runs';
import { sourcesRoute } from './sources';
import { suggestRoute } from './suggest';

// Each sub-app declares its own path. They are merged with no extra prefix;
// `index.ts` owns the `/v1` base so the version lives in one obvious place.
export const routes = new Hono<{ Bindings: Env }>()
  .route('/', articlesRoute)
  .route('/', articleRoute)
  .route('/', categoriesRoute)
  .route('/', suggestRoute)
  .route('/', runsRoute)
  .route('/', sourcesRoute)
  .route('/', healthRoute);
