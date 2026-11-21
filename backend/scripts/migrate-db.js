import pg from 'pg';
import { env } from '../src/config/env.js';
import { loadMigrations, migrate, MigrationError } from '../src/database/migrations.js';

const client = new pg.Client({
  connectionString: env.databaseUrl,
  ssl: env.production ? { rejectUnauthorized: true } : false,
  connectionTimeoutMillis: 10000,
  application_name: 'tracksense-migrations',
});
try {
  if (process.argv.slice(2).join(' ') !== '--apply') {
    throw new MigrationError('Use npm run db:inspect first. Run npm run db:migrate -- --apply against the intended development database to apply migrations.');
  }
  const migrations = await loadMigrations();
  await client.connect();
  const applied = await migrate(client, migrations);
  console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database migrations are up to date.');
} catch (error) {
  console.error(error instanceof MigrationError ? error.message : `Migration failed (${error.code || 'connection-or-query-error'}). No partial migration was committed.`);
  process.exitCode = 1;
} finally {
  await client.end();
}
