/**
 * Migration runner against the Neon PRODUCTION branch (standing policy,
 * owner-approved 2026-07-16: after every merge, apply new migrations to
 * Neon dev AND production). Reads PROD_DATABASE_URL from the gitignored
 * apps/api/.env — the production URL is never committed (D-020).
 *
 *   npm run migrate:prod -w apps/api        (up only; no prod down-runner on purpose)
 */
if (!process.env.PROD_DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.error('PROD_DATABASE_URL is not set (expected in gitignored apps/api/.env)');
  process.exit(1);
}
process.env.DATABASE_URL = process.env.PROD_DATABASE_URL;
process.argv[2] = 'up';
void import('./migrate.js');
