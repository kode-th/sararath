/**
 * Worker environment. `DATABASE_URL` is a secret (set in `.dev.vars` locally or
 * via `wrangler secret put`); `CORS_ORIGINS` is a non-secret `var` in
 * `wrangler.jsonc`. Kept explicit so `web/` can import `AppType` without pulling
 * the Worker-only generated binding types into its DOM program.
 */
export interface Env {
  /** Neon pooled URL. Must use the `postgresql://` scheme (not `postgresql+psycopg://`). */
  DATABASE_URL: string;
  /** Comma-separated allowed origins. Defaults to `*`. */
  CORS_ORIGINS?: string;
}
