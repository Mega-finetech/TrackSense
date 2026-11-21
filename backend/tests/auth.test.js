import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { loadMigrations, migrate } from '../src/database/migrations.js';
import { readEnvironment } from '../src/config/validateEnvironment.js';

process.env.DATABASE_URL = 'postgresql://127.0.0.1:1/test';
process.env.JWT_SECRET = 'test-only-signing-key-with-32-characters';
process.env.AUTH_PROVIDER = 'legacy';

const {
  OTP_LENGTH, OTP_MAX_ATTEMPTS, OTP_RESEND_SECONDS, OTP_TTL_SECONDS, REFRESH_TTL_SECONDS,
  buildAccessToken, buildRefreshToken, codeMatches, createOtp, expiryFromNow, hashCode,
  hashRefreshToken, safeUser, verifyRefreshToken,
} = await import('../src/services/authTokens.js');

test('OTP codes, keyed digests and expiry windows follow the required TTLs', () => {
  for (let index = 0; index < 50; index++) assert.match(createOtp(), /^\d{6}$/);
  assert.equal(OTP_LENGTH, 6);
  assert.equal(OTP_MAX_ATTEMPTS, 5);
  assert.equal(OTP_RESEND_SECONDS, 60);
  assert.equal(OTP_TTL_SECONDS.verify_email, 60);
  assert.equal(OTP_TTL_SECONDS.reset_password, 600);
  assert.equal(REFRESH_TTL_SECONDS, 30 * 24 * 60 * 60);

  const digest = hashCode('user-1', 'verify_email', '123456');
  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.equal(codeMatches(digest, 'user-1', 'verify_email', '123456'), true);
  assert.equal(codeMatches(digest, 'user-1', 'verify_email', '654321'), false);
  assert.equal(codeMatches(digest, 'user-2', 'verify_email', '123456'), false);
  assert.equal(codeMatches(digest, 'user-1', 'reset_password', '123456'), false);

  const now = Date.UTC(2026, 10, 3, 12, 0, 0);
  assert.equal(expiryFromNow(60, now).toISOString(), '2026-11-03T12:01:00.000Z');
  assert.equal(expiryFromNow(600, now).toISOString(), '2026-11-03T12:10:00.000Z');
});

test('access and refresh tokens are typed and refresh tokens are stored as digests', () => {
  const user = { id: '11111111-1111-4111-8111-111111111111', email: 'owner@example.test' };
  const access = buildAccessToken(user, 'session-1');
  const refresh = buildRefreshToken(user, 'session-1');
  const payload = verifyRefreshToken(refresh);
  assert.equal(payload.type, 'refresh');
  assert.equal(payload.id, user.id);
  assert.equal(payload.sid, 'session-1');
  assert.notEqual(hashRefreshToken(refresh), refresh);
  assert.match(hashRefreshToken(refresh), /^[a-f0-9]{64}$/);
  assert.throws(() => verifyRefreshToken(access), /expired/);
  assert.throws(() => verifyRefreshToken('not-a-token'), /expired/);
});

test('safe user responses expose verification without private fields', () => {
  assert.deepEqual(safeUser({
    id: 'user-1', name: 'Owner', email: 'owner@example.test',
    password_hash: 'secret', is_verified: true, created_at: new Date('2026-11-03T10:00:00Z'),
  }), {
    id: 'user-1', name: 'Owner', email: 'owner@example.test',
    isVerified: true, createdAt: '2026-11-03T10:00:00.000Z',
  });
  assert.equal(safeUser({ id: 'u', name: 'N', email: 'e', is_verified: false }).isVerified, false);
});

test('verification migration preserves existing accounts and defaults new accounts to unverified', async () => {
  const db = new PGlite();
  const query = (sql, args) => args ? db.query(sql, args) : db.exec(sql).then(results => results.at(-1));
  try {
    const migrations = await loadMigrations();
    await migrate({ query }, migrations.slice(0, 4));
    const existing = (await query("INSERT INTO users (name,email,password_hash) VALUES ('Existing','existing@example.test','fixture') RETURNING *")).rows[0];
    assert.deepEqual(await migrate({ query }, migrations), ['0005_auth_verification.sql']);
    assert.equal((await query('SELECT is_verified FROM users WHERE id=$1', [existing.id])).rows[0].is_verified, true);

    const fresh = (await query("INSERT INTO users (name,email,password_hash) VALUES ('Fresh','fresh@example.test','fixture') RETURNING *")).rows[0];
    assert.equal(fresh.is_verified, false);
    const challenge = (await query(
      "INSERT INTO auth_challenges (user_id,purpose,code_hash,expires_at) VALUES ($1,'verify_email',$2,NOW() + INTERVAL '60 seconds') RETURNING *",
      [fresh.id, 'digest']
    )).rows[0];
    assert.equal(challenge.purpose, 'verify_email');
    assert.equal(challenge.attempts, 0);
    assert.equal(challenge.consumed_at, null);

    const session = (await query(
      "INSERT INTO auth_sessions (id,user_id,refresh_token_hash,expires_at) VALUES (gen_random_uuid(),$1,$2,NOW() + INTERVAL '30 days') RETURNING *",
      [fresh.id, 'digest']
    )).rows[0];
    await query('UPDATE auth_sessions SET revoked_at=NOW() WHERE id=$1', [session.id]);
    assert.notEqual((await query('SELECT revoked_at FROM auth_sessions WHERE id=$1', [session.id])).rows[0].revoked_at, null);
    await assert.rejects(query("INSERT INTO auth_challenges (user_id,purpose,code_hash,expires_at) VALUES ($1,'invalid',$2,NOW())", [fresh.id, 'digest']), { code: '23514' });
    await query('DELETE FROM users WHERE id=$1', [fresh.id]);
    assert.equal((await query('SELECT COUNT(*)::int AS count FROM auth_challenges')).rows[0].count, 0);
    assert.equal((await query('SELECT COUNT(*)::int AS count FROM auth_sessions')).rows[0].count, 0);
  } finally { await db.close(); }
});

test('login validation resolves password rules instead of shadowing them', async () => {
  const { loginUser } = await import('../src/controllers/authController.js');
  const respond = async body => {
    const result = { statusCode: 200, body: undefined };
    const res = {
      status(code) { result.statusCode = code; return res; },
      json(payload) { result.body = payload; return res; },
    };
    let nextError;
    await loginUser({ body }, res, error => { nextError = error; });
    assert.equal(nextError, undefined, 'login validation must not throw');
    return result;
  };

  // A valid email with a missing password reaches the password rule. Before
  // the fix the local `validPassword` binding shadowed the module validator
  // and this request threw a temporal-dead-zone ReferenceError.
  const missingPassword = await respond({ email: 'owner@example.test' });
  assert.equal(missingPassword.statusCode, 400);
  assert.match(missingPassword.body.error, /valid email and password/i);

  const shortPassword = await respond({ email: 'owner@example.test', password: 'short' });
  assert.equal(shortPassword.statusCode, 400);
});

test('support and SMTP configuration are validated only when present', () => {
  const base = { DATABASE_URL: 'postgresql://localhost/test', JWT_SECRET: 'x'.repeat(32) };
  const defaults = readEnvironment(base);
  assert.equal(defaults.supportEmail, 'Tracksensehelpnow@gmail.com');
  assert.equal(defaults.supportWhatsapp, '2349057434214');
  assert.equal(defaults.smtpHost, '');
  assert.throws(() => readEnvironment({ ...base, SUPPORT_EMAIL: 'not-an-email' }), /SUPPORT_EMAIL/);
  assert.throws(() => readEnvironment({ ...base, SUPPORT_WHATSAPP: 'invalid' }), /SUPPORT_WHATSAPP/);
  assert.throws(() => readEnvironment({ ...base, SMTP_HOST: 'smtp.example.test', SMTP_PORT: '0' }), /SMTP_PORT/);
  assert.throws(() => readEnvironment({ ...base, SMTP_HOST: 'smtp.example.test', SMTP_USER: 'user' }), /SMTP_USER/);
  const smtp = readEnvironment({ ...base, SMTP_HOST: 'smtp.example.test', SMTP_PORT: '465', SMTP_USER: 'user', SMTP_PASS: 'pass' });
  assert.equal(smtp.smtpSecure, true);
});
