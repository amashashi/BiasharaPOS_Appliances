import { createDataSource } from '../src/db/data-source.js';

/** Apply migrations once before any test worker starts (see vitest.config.ts). */
export default async function setup(): Promise<void> {
  process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';
  const ds = createDataSource();
  await ds.initialize();
  try {
    await ds.runMigrations();
  } finally {
    await ds.destroy();
  }
}
