import test from 'node:test';
import assert from 'node:assert/strict';
import { remainingSeconds, pauseSession, resumeSession } from '../src/features/focus/clock.ts';
const session = { id: 'test', durationSeconds: 1500, remainingSeconds: 1500, endAt: 1_500_000 };
test('background elapsed time is derived from wall clock', () => {
  assert.equal(remainingSeconds(session, 1_200_000), 300);
  assert.equal(remainingSeconds(session, 1_700_000), 0);
});
test('pause and process-restored resume preserve remaining time', () => {
  const paused = JSON.parse(JSON.stringify(pauseSession(session, 300_000)));
  assert.equal(remainingSeconds(paused, 900_000), 1200);
  assert.equal(remainingSeconds(resumeSession(paused, 900_000), 1_200_000), 900);
});
test('repeated resume does not extend a running timer', () => {
  assert.deepEqual(resumeSession(session, 300_000), session);
});
test('elapsed background session keeps its original completion timestamp', () => {
  assert.equal(pauseSession(session, 1_600_000).endAt, 1_500_000);
});
