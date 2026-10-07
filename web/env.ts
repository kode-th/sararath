import { defineEnv } from '@vite-env/core';
import { z } from 'zod';

export default defineEnv({
  client: {
    VITE_API_URL: z.url().default('https://sararath-apis.fasu.dev'),
  },
});
