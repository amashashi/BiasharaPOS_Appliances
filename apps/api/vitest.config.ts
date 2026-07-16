import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Migrations run ONCE here — spec files must never call runMigrations():
    // parallel vitest workers racing to migrate a fresh DB is a CI flake
    // (CREATE EXTENSION IF NOT EXISTS is not concurrency-safe).
    globalSetup: ['./test/global-setup.ts'],
  },
});
