import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import bcrypt from 'bcrypt';
import { loadMigrations, migrate } from '../src/database/migrations.js';
import { readPreferences, savePreferences, validatePreferences } from '../src/services/accountPreferences.js';
import { readEnvironment } from '../src/config/validateEnvironment.js';

process.env.DATABASE_URL = 'postgresql://127.0.0.1:1/test';
process.env.JWT_SECRET = 'test-only-signing-key-with-32-characters';
const { verifySupabaseToken, provisionIdentity, findIdentity } = await import('../src/services/supabaseIdentity.js');
const config = { supabaseUrl: 'https://auth.example.test', supabaseKey: 'test-public-key' };
const subject = '11111111-1111-4111-8111-111111111111';

test('Supabase requires explicit complete configuration and a safe origin', () => {
  const base = { DATABASE_URL: 'postgresql://localhost/test', JWT_SECRET: 'x'.repeat(32) };
  assert.throws(() => readEnvironment({ ...base, AUTH_PROVIDER: 'supabase' }), /required/);
  assert.throws(() => readEnvironment({ ...base, SUPABASE_URL: 'https://user:password@example.test' }), /Invalid/);
  assert.throws(() => readEnvironment({ ...base, AUTH_PROVIDER: 'unknown' }), /Invalid/);
  assert.equal(readEnvironment(base).authProvider, 'legacy');
});
test('provider verification uses only the configured Auth origin and verified identity', async () => {
  const identity = await verifySupabaseToken('test-token', config, async (url, options) => {
    assert.equal(url, 'https://auth.example.test/auth/v1/user');
    assert.equal(options.headers.apikey, 'test-public-key');
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert.equal(options.redirect, 'error');
    return { ok: true, json: async () => ({ id: subject, email: 'Owner@example.test', email_confirmed_at: '2026-09-17', user_metadata: { name: 'Owner' } }) };
  });
  assert.equal(identity.email, 'owner@example.test');
  assert.equal(identity.issuer, config.supabaseUrl);
  await assert.rejects(verifySupabaseToken('invalid', config, async () => ({ ok: false, status: 401 })), { status: 401 });
  await assert.rejects(verifySupabaseToken('token', config, async () => { throw new Error('private remote details'); }), { status: 503 });
  await assert.rejects(verifySupabaseToken('token', config, async () => ({ ok: true, json: async () => ({ id: subject, email: 'owner@example.test' }) })), { status: 403 });
});
test('identity linking preserves IDs and rejects email-only takeover or a second identity', async () => {
  const db = new PGlite();
  const query = (sql, args) => args ? db.query(sql, args) : db.exec(sql).then(results => results.at(-1));
  const pool = { connect: async () => ({ query, release() {} }) };
  try {
    await migrate({ query }, await loadMigrations());
    const hash = await bcrypt.hash('test-password-only', 4);
    const user = (await query("INSERT INTO users (name,email,password_hash) VALUES ('Owner','owner@example.test',$1) RETURNING id", [hash])).rows[0];
    const goal = (await query("INSERT INTO goals (user_id,title,category,status) VALUES ($1,'Keep my goal','Personal','active') RETURNING id", [user.id])).rows[0];
    const identity = { issuer: config.supabaseUrl, subject, email: 'owner@example.test', name: 'Owner' };
    await assert.rejects(provisionIdentity(pool, identity), { status: 409 });
    await assert.rejects(provisionIdentity(pool, identity, 'wrong-password'), { status: 409 });
    assert.equal((await provisionIdentity(pool, identity, 'test-password-only')).id, user.id);
    assert.equal((await provisionIdentity(pool, identity)).id, user.id);
    assert.equal((await findIdentity(query, identity)).id, user.id);
    assert.equal((await query('SELECT user_id FROM goals WHERE id=$1', [goal.id])).rows[0].user_id, user.id);
    await assert.rejects(provisionIdentity(pool, { ...identity, subject: '22222222-2222-4222-8222-222222222222' }, 'test-password-only'), { status: 409 });
    const newcomer = await provisionIdentity(pool, { ...identity, subject: '33333333-3333-4333-8333-333333333333', email: 'new@example.test' });
    assert.notEqual(newcomer.id, user.id);
    assert.equal(await findIdentity(query, { ...identity, issuer: 'https://different.example.test' }), undefined);
  } finally { await db.close(); }
});
test('preferences persist per owner, reject stale writes and support empty focus selections', async () => {
  const db = new PGlite();
  const query = (sql, args) => args ? db.query(sql, args) : db.exec(sql).then(results => results.at(-1));
  try {
    await migrate({ query }, await loadMigrations());
    const users = (await query("INSERT INTO users (name,email,password_hash) VALUES ('A','a@example.test','test'),('B','b@example.test','test') RETURNING id")).rows;
    const value = { focusAreas: [], onboarded: true, theme: 'dark', revision: 0 };
    assert.equal(await readPreferences(query, users[0].id), null);
    const saved = await savePreferences(query, users[0].id, value);
    assert.equal(saved.revision, 1);
    assert.equal(await readPreferences(query, users[1].id), null);
    await assert.rejects(savePreferences(query, users[0].id, value), { status: 409 });
    assert.equal((await savePreferences(query, users[0].id, { ...saved, theme: 'light' })).revision, 2);
    await assert.rejects(savePreferences(query, users[0].id, saved), { status: 409 });
    assert.throws(() => validatePreferences({ ...value, user_id: users[1].id }), { status: 400 });
    assert.throws(() => validatePreferences({ ...value, focusAreas: ['Invalid'] }), { status: 400 });
    await query('DELETE FROM users WHERE id=$1', [users[0].id]);
    assert.equal(await readPreferences(query, users[0].id), null);
  } finally { await db.close(); }
});
