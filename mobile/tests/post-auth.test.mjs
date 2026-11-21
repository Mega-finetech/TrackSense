import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiUrl } from '../src/services/apiUrl.ts';
import { finishSignup, profileSetupMessage, isExistingAccount } from '../src/services/postAuth.ts';
import { safeAuthError } from '../src/services/authDiagnostics.ts';

test('API origin and /api configuration both reach mounted backend routes', () => {
  for (const value of ['http://device.test:4000', 'http://device.test:4000/', 'http://device.test:4000/api/']) assert.equal(resolveApiUrl(value, ''), 'http://device.test:4000/api');
  assert.equal(resolveApiUrl(undefined, 'fallback'), 'fallback');
  assert.equal(resolveApiUrl('https://user:secret@example.test/api', ''), '');
  assert.equal(resolveApiUrl('https://example.test/?key=secret', ''), '');
});
test('confirmed signup hands session to backend linking and preserves success result', async () => {
  let links = 0;
  const result = await finishSignup({ user: { identities: [{}] }, session: {} }, async () => { links++; return { data: { user: { id: 'internal-id' } } }; });
  assert.equal(links, 1);
  assert.equal(result.data.user.id, 'internal-id');
});
test('post-signup linking failure reports account creation without leaking remote details', async () => {
  await assert.rejects(finishSignup({ user: {}, session: {} }, async () => { throw new Error('private token/password'); }), { message: profileSetupMessage });
});
test('email confirmation and duplicate registration never attempt backend linking', async () => {
  const link = () => { throw new Error('Must not link'); };
  assert.deepEqual(await finishSignup({ user: {}, session: null }, link), { verificationRequired: true });
  await assert.rejects(finishSignup({ user: { identities: [] }, session: null }, link), /sign in instead/);
  assert.equal(isExistingAccount({ code: 'user_already_exists' }), true);
});
test('diagnostics discard raw messages, tokens, headers and arbitrary codes', () => {
  assert.deepEqual(safeAuthError({ code: 'sensitive-value', message: 'secret', response: { status: 404, data: 'secret' }, config: { headers: { Authorization: 'secret' } } }), { code: 'AUTH_FLOW_ERROR', status: 404 });
  assert.deepEqual(safeAuthError({ code: 'ERR_NETWORK' }), { code: 'ERR_NETWORK', status: undefined });
});
