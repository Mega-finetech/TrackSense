import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';

export class MigrationError extends Error {}

export async function loadMigrations(directory = new URL('../../db/migrations/', import.meta.url)) {
  const files = (await readdir(directory)).filter(name => /^\d{4}_[a-z0-9_]+\.sql$/.test(name)).sort();
  if (!files.length) throw new MigrationError('No migrations found.');
  const migrations = [];
  for (const name of files) {
    const sql = (await readFile(new URL(name, directory), 'utf8')).replace(/\r\n/g, '\n');
    migrations.push({ name, sql, checksum: createHash('sha256').update(sql).digest('hex') });
  }
  return migrations;
}

export function pendingMigrations(migrations, history) {
  for (let index = 0; index < history.length; index++) {
    const recorded = history[index];
    const expected = migrations[index];
    if (!expected || expected.name !== recorded.name || expected.checksum !== recorded.checksum) {
      throw new MigrationError('Migration history differs from the checked-in files. Restore the original files before proceeding.');
    }
  }
  return migrations.slice(history.length);
}

// The caller supplies one dedicated connection for the entire transaction.
export async function migrate(client, migrations) {
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '60s'");
    await client.query('SET LOCAL search_path = public');
    await client.query('SELECT pg_advisory_xact_lock(842671, 1)');
    const relations = await client.query(`SELECT c.relname AS name FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','f','S')`);
    const hasHistory = relations.rows.some(row => row.name === 'tracksense_migrations');
    if (!hasHistory && relations.rows.length) {
      throw new MigrationError('Existing public schema has no TrackSense migration history. Inspect and rehearse a data migration on a copy; initialization was refused.');
    }
    await client.query(`CREATE TABLE IF NOT EXISTS public.tracksense_migrations (
      name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const history = await client.query('SELECT name, checksum FROM public.tracksense_migrations ORDER BY name');
    if (hasHistory && !history.rows.length && relations.rows.some(row => row.name !== 'tracksense_migrations')) {
      throw new MigrationError('Empty migration history beside existing tables; initialization was refused.');
    }
    const pending = pendingMigrations(migrations, history.rows);
    for (const migration of pending) {
      await client.query(migration.sql);
      await client.query('INSERT INTO public.tracksense_migrations (name, checksum) VALUES ($1, $2)', [migration.name, migration.checksum]);
    }
    await client.query('COMMIT');
    return pending.map(item => item.name);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
