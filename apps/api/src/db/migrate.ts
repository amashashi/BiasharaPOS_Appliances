/* Migration runner: node dist/db/migrate.js [up|down] */
import { createDataSource } from './data-source.js';

async function main(): Promise<void> {
  const direction = process.argv[2] ?? 'up';
  const ds = createDataSource();
  await ds.initialize();
  try {
    if (direction === 'down') {
      await ds.undoLastMigration();
      // eslint-disable-next-line no-console
      console.log('reverted last migration');
    } else {
      const applied = await ds.runMigrations();
      // eslint-disable-next-line no-console
      console.log(`applied ${applied.length} migration(s): ${applied.map((m) => m.name).join(', ') || '(none pending)'}`);
    }
  } finally {
    await ds.destroy();
  }
}

void main();
