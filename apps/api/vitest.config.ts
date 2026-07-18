import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Migrations run ONCE here — spec files must never call runMigrations():
    // parallel vitest workers racing to migrate a fresh DB is a CI flake
    // (CREATE EXTENSION IF NOT EXISTS is not concurrency-safe).
    globalSetup: ['./test/global-setup.ts'],
    // These are real-Postgres + real-Redis integration tests; under parallel
    // workers on a single-instance dev DB the 5s default is too tight (a heavy
    // spec occasionally times out). A generous ceiling accommodates contention
    // without hiding a genuine hang.
    testTimeout: 20000,
    hookTimeout: 40000,
  },
});
