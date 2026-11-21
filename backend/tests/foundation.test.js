import test from 'node:test';
import assert from 'node:assert/strict';
import { readEnvironment } from '../src/config/validateEnvironment.js';
import { saveFocusSession } from '../src/services/saveFocusSession.js';
import jwt from 'jsonwebtoken';

test('missing or weak JWT configuration fails closed', () => {
  for (const JWT_SECRET of [undefined, '', 'short']) assert.throws(() => readEnvironment({ DATABASE_URL: 'postgresql://localhost/test', JWT_SECRET }), /JWT_SECRET/);
  assert.throws(() => readEnvironment({ JWT_SECRET: 'x'.repeat(32) }), /DATABASE_URL/);
  assert.throws(() => readEnvironment({ DATABASE_URL: 'postgresql://localhost/test', JWT_SECRET: 'x'.repeat(32), PORT: 'invalid' }), /PORT/);
});
test('valid explicit configuration has no fallback signing key', () => {
  const env = readEnvironment({ DATABASE_URL: 'postgresql://localhost/test', JWT_SECRET: 'x'.repeat(32), NODE_ENV: 'production' });
  assert.equal(env.jwtSecret, 'x'.repeat(32)); assert.equal(env.production, true);
});
test('auth startup uses explicit environment and rejects wrong algorithms or claims', async () => {
  process.env.DATABASE_URL = 'postgresql://127.0.0.1:1/test';
  process.env.JWT_SECRET = 'test-only-signing-key-with-32-characters';
  process.env.AUTH_PROVIDER = 'legacy'; // Do not inherit the developer's hosted provider setting.
  const { createAuthMiddleware } = await import('../src/middleware/authMiddleware.js');
  const auth = createAuthMiddleware(async () => ({ rows: [{id:'alice'}] }));
  const run = async token => {
    const result = { status: 200, next: false };
    auth({ headers: { authorization: `Bearer ${token}` } }, { status(code) { result.status = code; return this; }, json() {} }, () => { result.next = true; });
    await new Promise(resolve => setImmediate(resolve));
    return result;
  };
  assert.equal((await run(jwt.sign({ id: 'alice' }, process.env.JWT_SECRET))).next, true);
  assert.equal((await run(jwt.sign({ id: 'alice' }, process.env.JWT_SECRET, { algorithm: 'HS384' }))).status, 401);
  assert.equal((await run(jwt.sign({ email: 'test@example.test' }, process.env.JWT_SECRET))).status, 401);
});
test('retrying a focus save returns the original record', async () => {
  const records = new Map();
  const query = async (sql, params) => {
    if (sql.startsWith('INSERT')) {
      assert.match(sql, /ON CONFLICT \(id\) DO NOTHING/);
      if (records.has(params[5])) return { rows: [] };
      const row = { id: params[5], user_id: params[0], duration: params[3] }; records.set(row.id, row); return { rows: [row] };
    }
    assert.match(sql, /user_id = \$2/);
    const row = records.get(params[0]); return { rows: row?.user_id === params[1] ? [row] : [] };
  };
  const request = { userId: 'alice', sessionId: 'stable-id', duration: 25, type: 'pomodoro', completedAt: '2026-09-16T10:00:00Z' };
  const first = await saveFocusSession(query, request);
  assert.deepEqual(await saveFocusSession(query, request), first);
  assert.equal(records.size, 1);
  await assert.rejects(saveFocusSession(query, { ...request, userId: 'bob' }), { status: 409 });
});
