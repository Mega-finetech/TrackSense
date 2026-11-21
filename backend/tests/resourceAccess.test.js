import test from 'node:test';
import assert from 'node:assert/strict';
import { createResourceAccess } from '../src/middleware/resourceAccess.js';

const id = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
test('planning writes reject invalid statuses, dates and empty milestones', async () => {
  for (const resource of ['goals', 'projects']) {
    for (const body of [{ title: 'Plan', status: 'invalid' }, { title: 'Plan', deadline: 'invalid' }]) {
      assert.equal((await request(resource, { method: 'POST', body })).status, 400);
    }
    assert.equal((await request(resource, { method: 'POST', path: `/${id}/milestones`, body: { title: ' ' } })).status, 400);
    assert.equal(await request(resource, { method: 'POST', path: `/${id}/milestones`, body: { title: 'First step' } }), undefined);
    assert.equal((await request(resource, { method: 'GET', path: `/${id}/milestones` }, async () => ({ rows: [] }))).status, 404);
  }
});
async function request(resource, request, query = async () => ({ rows: [{ id }] })) {
  let error;
  let called = false;
  await createResourceAccess(resource, query)({ user: { id: 'owner' }, path: '/', method: 'GET', ...request }, {}, value => { called = true; error = value; });
  assert.equal(called, true);
  return error;
}
for (const resource of ['tasks', 'goals', 'projects', 'courses', 'assignments', 'exams', 'study-sessions', 'bible-plans', 'notifications']) {
  for (const method of ['PUT', 'DELETE']) test(`${resource}: ${method} cannot target another user's record`, async () => {
    const error = await request(resource, { path: `/${id}`, method, body: { title: 'Changed' } }, async (sql, args) => {
      assert.match(sql, /user_id = \$2/); assert.deepEqual(args, [id, 'owner']); return { rows: [] };
    });
    assert.equal(error.status, 404);
  });
}
test('rejects ownership reassignment and SQL identifiers', async () => {
  for (const body of [{ user_id: other }, { 'title = NULL WHERE true --': 'x' }, {}, []]) {
    const error = await request('tasks', { path: `/${id}`, method: 'PUT', body });
    assert.equal(error.status, 400);
  }
});
test('checks linked task parent before creation', async () => {
  const error = await request('tasks', { method: 'POST', body: { title: 'Read', goal_id: other } }, async (sql, args) => {
    assert.match(sql, /FROM goals/); assert.deepEqual(args, [other, 'owner']); return { rows: [] };
  });
  assert.equal(error.status, 404);
});
test('milestones are authorized through their parent', async () => {
  for (const [resource, path, table] of [['goals', `/milestones/${id}/toggle`, 'goals'], ['projects', `/milestones/${id}/toggle`, 'projects'], ['milestones', `/${id}/toggle`, 'goals']]) {
    const error = await request(resource, { path, method: 'PATCH' }, async sql => { assert.ok(sql.includes(`JOIN ${table}`)); return { rows: [] }; });
    assert.equal(error.status, 404);
  }
});
test('course-filtered reads require ownership of course', async () => {
  const error = await request('assignments', { path: `/course/${id}` }, async sql => { assert.match(sql, /FROM courses/); return { rows: [] }; });
  assert.equal(error.status, 404);
});
test('ordinary users cannot invoke notification cron', async () => {
  assert.equal((await request('notifications', { path: '/cron/check-all', method: 'POST' })).status, 403);
});
test('valid owned task update is allowed', async () => {
  assert.equal(await request('tasks', { path: `/${id}`, method: 'PUT', body: { status: 'done' } }), undefined);
});
test('invalid task values and anonymous access are rejected', async () => {
  for (const body of [{ title: '' }, { title: 'Read', status: 'invented' }, { title: 'Read', due_date: 'yesterday' }, { title: 'Read', is_recurring: 'false' }]) {
    assert.equal((await request('tasks', { method: 'POST', body })).status, 400);
  }
  assert.equal((await request('tasks', { user: undefined })).status, 401);
});
test('course checklists and assignment scores are validated before writing', async () => {
  for (const body of [
    { topics: 'not-an-array' },
    { topics: [{ id: 't1', title: '', completed: false }] },
    { topics: [{ id: 't1', title: 'Arrays' }] },
    { modules: [{ id: 'm1', title: 'Module', isCompleted: 'no' }] },
  ]) {
    assert.equal((await request('courses', { method: 'PUT', path: `/${id}`, body })).status, 400);
  }
  for (const body of [{ earned_score: -1 }, { total_score: 0 }, { earned_score: 9, total_score: 8 }]) {
    assert.equal((await request('assignments', { method: 'PUT', path: `/${id}`, body })).status, 400);
  }
  assert.equal(await request('courses', { method: 'PUT', path: `/${id}`, body: { topics: [{ id: 't1', title: 'Arrays', completed: false }] } }), undefined);
  assert.equal(await request('assignments', { method: 'PUT', path: `/${id}`, body: { earned_score: 8, total_score: 10 } }), undefined);
});
