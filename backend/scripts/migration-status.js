import pg from 'pg';
import { env } from '../src/config/env.js';
import { loadMigrations, pendingMigrations, MigrationError } from '../src/database/migrations.js';
import { safeErrorCode } from '../src/utils/safeError.js';

const client = new pg.Client({ connectionString: env.databaseUrl, ssl: env.production ? { rejectUnauthorized: true } : false, connectionTimeoutMillis: 10000 });
try {
  const migrations = await loadMigrations();
  await client.connect();
  await client.query('BEGIN READ ONLY');
  await client.query("SET LOCAL statement_timeout = '10s'");
  const { rows } = await client.query(`SELECT c.relname AS table_name FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','f','S')`);
  const hasHistory = rows.some(row => row.table_name === 'tracksense_migrations');
  if (!hasHistory && rows.length) {
    console.log(JSON.stringify({ status: 'unversioned-existing-schema', tableCount: rows.length, action: 'Do not initialize. Compare schema and rehearse conversion on a copy.' }));
    process.exitCode = 2;
  } else {
    const history = hasHistory ? (await client.query('SELECT name, checksum FROM public.tracksense_migrations ORDER BY name')).rows : [];
    if (!history.length && rows.some(row => row.table_name !== 'tracksense_migrations')) throw new MigrationError('Existing schema has an empty migration history. Initialization is unsafe; inspect before proceeding.');
    const pending = pendingMigrations(migrations, history);
    console.log(JSON.stringify({ status: hasHistory ? 'versioned' : 'empty', applied: history.map(item => item.name), pending: pending.map(item => item.name) }));
  }
  await client.query('ROLLBACK');
} catch (error) {
  console.error(error instanceof MigrationError ? error.message : `Migration status unavailable (${safeErrorCode(error)}). No migrations applied.`);
  process.exitCode = 1;
} finally { await client.end(); }
