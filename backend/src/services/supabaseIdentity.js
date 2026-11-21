import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
const fail = (status, message) => Object.assign(new Error(message), { status });
export async function verifySupabaseToken(token, config = env, fetcher = fetch) {
  if (!config.supabaseUrl || !config.supabaseKey) throw fail(503, 'Supabase authentication is not configured.');
  if (typeof token !== 'string' || !token) throw fail(401, 'Authentication required');
  // Auth's /user endpoint verifies against the configured project, not client claims.
  let response;
  try { response = await fetcher(`${config.supabaseUrl}/auth/v1/user`, { headers: { apikey: config.supabaseKey, Authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(10000) }); }
  catch { throw fail(503, 'Authentication service is unavailable. Please try again.'); }
  if (!response.ok) throw fail(response.status >= 500 || response.status === 429 ? 503 : 401, 'Unable to verify your session. Please try signing in again.');
  let user;
  try { user = await response.json(); } catch { throw fail(503, 'Invalid authentication service response.'); }
  if (!user?.email_confirmed_at || typeof user.email !== 'string' || typeof user.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(user.id)) throw fail(403, 'Verify your email before continuing.');
  return { issuer: config.supabaseUrl, subject: user.id, email: user.email.toLowerCase(), name: typeof user.user_metadata?.name === 'string' ? user.user_metadata.name.slice(0, 100) : 'TrackSense user' };
}
export async function findIdentity(query, identity) {
  return (await query('SELECT u.id, u.name, u.email, u.is_verified, u.created_at FROM auth_identities i JOIN users u ON u.id=i.user_id WHERE i.issuer=$1 AND i.subject=$2', [identity.issuer, identity.subject])).rows[0];
}

export async function provisionIdentity(pool, identity, legacyPassword) {
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    await connection.query('SELECT pg_advisory_xact_lock(hashtext($1))', [identity.issuer + ':' + identity.subject]);
    const query = (sql, args) => connection.query(sql, args);
    const deleted = await query('SELECT 1 FROM account_deletions WHERE identities @> $1::jsonb', [JSON.stringify([{issuer:identity.issuer,subject:identity.subject}])]);
    if (deleted.rows.length) throw fail(403, 'This account has been scheduled for deletion.');
    let user = await findIdentity(query, identity);
    if (!user) {
      const existing = (await query('SELECT id,name,email,password_hash FROM users WHERE lower(email)=lower($1)', [identity.email])).rows;
      if (existing.length) {
        if (existing.length !== 1 || typeof legacyPassword !== 'string' || !await bcrypt.compare(legacyPassword, existing[0].password_hash)) throw fail(409, 'An existing TrackSense account needs its current password to link securely.');
        // The provider has already confirmed this email address.
        user = (await query('UPDATE users SET is_verified=TRUE WHERE id=$1 RETURNING id,name,email,is_verified,created_at', [existing[0].id])).rows[0];
      } else {
        const hash = await bcrypt.hash(randomBytes(48).toString('base64url'), 12);
        user = (await query('INSERT INTO users (name,email,password_hash,is_verified) VALUES ($1,$2,$3,TRUE) RETURNING id,name,email,is_verified,created_at', [identity.name || 'TrackSense user', identity.email, hash])).rows[0];
      }
      await query('INSERT INTO auth_identities (issuer,subject,user_id) VALUES ($1,$2,$3)', [identity.issuer, identity.subject, user.id]);
    }
    await connection.query('COMMIT');
    return { id: user.id, name: user.name, email: user.email, isVerified: user.is_verified === true, createdAt: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at };
  } catch (error) {
    await connection.query('ROLLBACK');
    if (error.code === '23505') throw fail(409, 'Account identity is already linked.');
    throw error;
  } finally { connection.release(); }
}
