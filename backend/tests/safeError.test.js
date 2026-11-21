import test from 'node:test';
import assert from 'node:assert/strict';
import { safeErrorCode } from '../src/utils/safeError.js';

test('database diagnostics expose codes without leaking messages, URLs or queries', () => {
  assert.equal(safeErrorCode({ code: '28P01', message: 'secret password', detail: 'private query' }), '28P01');
  assert.equal(safeErrorCode({ code: 'postgresql://private:secret@server/db' }), 'INTERNAL_ERROR');
  assert.equal(safeErrorCode(new Error('secret password')), 'INTERNAL_ERROR');
  assert.equal(safeErrorCode({ code: 'ECONNREFUSED' }), 'ECONNREFUSED');
});
