// Real hosted Auth + local PostgreSQL check. Uses an existing disposable account;
// never signs up, deletes data, prints identities, or prints authentication values.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import dotenv from 'dotenv';
import pg from 'pg';
import { env } from '../src/config/env.js';
const requireMobile = createRequire(new URL('../../mobile/package.json', import.meta.url));
const { createClient } = requireMobile('@supabase/supabase-js');
const email = process.env.TRACKSENSE_TEST_EMAIL;
const password = process.env.TRACKSENSE_TEST_PASSWORD;
if (!email || !password) {
  console.log('BLOCKED: Set TRACKSENSE_TEST_EMAIL and TRACKSENSE_TEST_PASSWORD privately in backend/.env for the existing disposable account.');
  process.exitCode = 2;
} else {
  const mobile = dotenv.parse(readFileSync(new URL('../../mobile/.env', import.meta.url)));
  const api = new URL(mobile.EXPO_PUBLIC_API_URL);
  if (api.username || api.password || api.search || api.hash || !['http:', 'https:'].includes(api.protocol)) throw new Error('Invalid API origin');
  api.pathname = api.pathname.replace(/\/+$/, '') || '/api';
  const base = api.toString().replace(/\/$/, '');
  const pool = new pg.Pool({ connectionString: env.databaseUrl, connectionTimeoutMillis: 5000 });
  const auth = createClient(env.supabaseUrl, env.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }).auth;
  const check = (condition, stage) => { if (!condition) throw new Error(stage); console.log(`PASS ${stage}`); };
  const request = async (path, token, method = 'GET') => {
    const response = await fetch(base + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(method === 'POST' ? { body: '{}' } : {}), signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw Object.assign(new Error('BACKEND_REQUEST'), { status: response.status });
    return response.json();
  };
  try {
    check((await pool.query('SELECT current_database() AS name')).rows[0].name === 'tracksense', 'DATABASE_TARGET');
    const login = await auth.signInWithPassword({ email, password });
    check(!login.error && !!login.data.session, 'SUPABASE_LOGIN_SESSION');
    let session = login.data.session;
    const first = await request('/auth/supabase/session', session.access_token, 'POST');
    check(!!first.data?.user?.id, 'BACKEND_LINK');
    const id = first.data.user.id;
    const profile = await request('/auth/me', session.access_token);
    check(profile.data?.id === id, 'AUTHENTICATED_INTERNAL_PROFILE');
    const refresh = await auth.refreshSession();
    check(!refresh.error && !!refresh.data.session, 'PROVIDER_SESSION_REFRESH');
    session = refresh.data.session;
    check((await request('/auth/supabase/session', session.access_token, 'POST')).data.user.id === id, 'REPEATED_LINK_SAME_ID');
    check(!(await auth.signOut({ scope: 'local' })).error, 'SIGN_OUT_TEST_SESSION');
    const again = await auth.signInWithPassword({ email, password });
    check(!again.error && !!again.data.session, 'LOGIN_AGAIN');
    check((await request('/auth/supabase/session', again.data.session.access_token, 'POST')).data.user.id === id, 'LOGIN_AGAIN_SAME_ID');
    const counts = (await pool.query(`SELECT
      (SELECT count(*)::int FROM users WHERE lower(email)=lower($1)) AS accounts,
      (SELECT count(*)::int FROM auth_identities WHERE issuer=$2 AND subject=$3 AND user_id=$4) AS identities`, [email, env.supabaseUrl, again.data.user.id, id])).rows[0];
    check(counts.accounts === 1 && counts.identities === 1, 'DATABASE_SINGLE_ACCOUNT_AND_IDENTITY');
    console.log('DEVICE CHECKS STILL REQUIRED: onboarding navigation and close/reopen restoration. No account data deleted.');
  } catch (error) {
    console.log(JSON.stringify({ result: 'FAIL', status: Number.isInteger(error.status) ? error.status : undefined, stage: /^[A-Z_]+$/.test(error.message) ? error.message : 'VERIFICATION_ERROR' }));
    process.exitCode = 1;
  } finally {
    await auth.signOut({ scope: 'local' }).catch(() => {});
    await pool.end();
  }
}
