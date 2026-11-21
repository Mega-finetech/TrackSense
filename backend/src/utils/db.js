import pg from 'pg';
import { env } from '../config/env.js';
import { safeErrorCode } from './safeError.js';

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: env.production ? { rejectUnauthorized: true } : false,
  connectionTimeoutMillis: 10000,
});

pool.on('error', error => console.error(`Database pool error (${safeErrorCode(error)}).`));

export const query = (text, params) => pool.query(text, params);
export default pool;
