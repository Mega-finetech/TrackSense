import pg from 'pg';
import { env } from '../src/config/env.js';

// Catalog metadata only: never fetch account or application records.
const client = new pg.Client({
  connectionString: env.databaseUrl,
  ssl: env.production ? { rejectUnauthorized: true } : false,
  connectionTimeoutMillis: 10000,
  application_name: 'tracksense-schema-inspection',
});

try {
  await client.connect();
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  await client.query("SET LOCAL statement_timeout = '10s'");
  const columns = await client.query(`
    SELECT table_name, column_name, data_type, udt_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);
  const constraints = await client.query(`
    SELECT c.relname AS table_name, con.conname AS name, con.contype AS type
    FROM pg_catalog.pg_constraint con
    JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    ORDER BY c.relname, con.conname
  `);
  await client.query('ROLLBACK');
  console.log(JSON.stringify({ columns: columns.rows, constraints: constraints.rows }, null, 2));
} catch (error) {
  // Driver error messages may include connection details; expose only a code.
  console.error(`Database inspection failed (${error.code || 'connection-or-query-error'}). No records were read or modified.`);
  process.exitCode = 1;
} finally {
  await client.end();
}
