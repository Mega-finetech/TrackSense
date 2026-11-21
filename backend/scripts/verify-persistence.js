import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { env } from '../src/config/env.js';
import { safeErrorCode } from '../src/utils/safeError.js';
import jwt from 'jsonwebtoken';

// Opt-in REAL HTTP + PostgreSQL verification. No fixtures and no schema changes.
// Creates two dedicated accounts; cleanup is restricted to this run's exact IDs/emails.
let server;
let connected = false;
let outcome;
class VerificationError extends Error {}
const checks = [];
const accounts = [];
const runId = randomUUID();
const password = randomBytes(32).toString('base64url');
const db = new pg.Client({ connectionString: env.databaseUrl, ssl: env.production ? { rejectUnauthorized: true } : false, connectionTimeoutMillis: 10000 });
const check = (condition, label) => {
  if (!condition) throw new VerificationError(label);
  checks.push(label);
};
async function stop() {
  if (server && server.exitCode === null && server.signalCode === null) {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
  server = undefined;
}
try {
  if (process.argv.slice(2).join(' ') !== '--run' || env.production) throw new VerificationError('Requires --run and a development database configuration');
  await db.connect();
  connected = true;
  const target = await db.query("SELECT current_database() = 'tracksense' AS allowed");
  check(target.rows[0].allowed, 'Target database is tracksense');
  checks.push('Configured PostgreSQL connection');
  const reservation = createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const base = `http://127.0.0.1:${port}/api`;
  async function start() {
    server = spawn(process.execPath, ['server.js'], {
      cwd: fileURLToPath(new URL('../', import.meta.url)),
      env: { ...process.env, PORT: String(port) }, windowsHide: true,
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    let spawnError;
    server.on('error', error => { spawnError = error; });
    const limit = Date.now() + 20000;
    while (Date.now() < limit) {
      if (spawnError) throw spawnError;
      if (server.exitCode !== null) throw new VerificationError('Backend exited before readiness');
      try {
        const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(1500) });
        if (response.ok && (await response.json()).database === 'connected') return;
      } catch { /* Bounded wait for the dedicated child server. */ }
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    throw new VerificationError('Backend readiness timed out');
  }
  async function request(path, token, method = 'GET', body, expected = 200) {
    const response = await fetch(base + path, {
      method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000),
    });
    if (response.status !== expected) throw new VerificationError(`${method} ${path.replace(/[0-9a-f-]{36}/gi, ':id')} expected ${expected}, received ${response.status}`);
    return response.json();
  }
  await start();
  for (const label of ['owner', 'other']) {
    const email = `tracksense-persistence-${runId}-${label}@example.test`;
    const registration = await request('/auth/register', null, 'POST', { name: `Persistence ${label}`, email, password }, 201);
    accounts.push({ email, id: registration.data.user.id });
    const login = await request('/auth/login', null, 'POST', { email, password });
    check(login.data.user.id === registration.data.user.id, `${label}: registration and login`);
    accounts.at(-1).token = login.data.token;
  }
  let token = accounts[0].token;
  const other = accounts[1].token;
  check(await request('/preferences', token) === null, 'New account has no cloud preferences');
  const preferences = { focusAreas: [], onboarded: true, theme: 'dark', revision: 0 };
  const preferenceSave = await request('/preferences', token, 'PUT', preferences);
  check(preferenceSave.revision === 1, 'Cloud preferences saved with revision');
  await request('/preferences', token, 'PUT', preferences, 409);
  check(await request('/preferences', other) === null, 'Cloud preferences isolated from second user');
  await request('/preferences', other, 'PUT', { ...preferences, user_id: accounts[0].id }, 400);
  await request('/preferences', null, 'GET', undefined, 401);
  await request('/preferences', other, 'PUT', { ...preferences, theme: 'light', focusAreas: ['Tasks'] });
  checks.push('Stale preference revision and ownership reassignment rejected');
  await request('/auth/login', null, 'POST', { email: accounts[0].email, password: 'deliberately-wrong-password' }, 401);
  await request('/auth/register', null, 'POST', { name: 'Duplicate test', email: accounts[0].email, password }, 409);
  await request('/goals', 'invalid-token', 'GET', undefined, 401);
  const expired = jwt.sign({ id: accounts[0].id }, env.jwtSecret, { expiresIn: -1 });
  await request('/goals', expired, 'GET', undefined, 401);
  const badSignature = jwt.sign({ id: accounts[0].id }, randomBytes(32).toString('hex'));
  await request('/goals', badSignature, 'GET', undefined, 401);
  check((await request('/auth/me', token)).data.id === accounts[0].id, 'Authenticated identity matches account');
  checks.push('Wrong password, duplicate registration, malformed/expired/incorrectly signed tokens rejected');
  const goal = await request('/goals', token, 'POST', { title: 'Persistence goal', category: 'Personal', status: 'active' }, 201);
  await request(`/goals/${goal.id}`, token, 'PUT', { title: 'Persisted goal', description: 'Dedicated database verification record' });
  const project = await request('/projects', token, 'POST', { title: 'Persistence project', status: 'active' }, 201);
  await request(`/projects/${project.id}`, token, 'PUT', { title: 'Persisted project' });
  const milestone = (await request(`/goals/${goal.id}/milestones`, token, 'POST', { title: 'Persistence milestone' }, 201)).milestone;
  await request(`/goals/milestones/${milestone.id}/toggle`, token, 'PATCH');
  const projectMilestone = await request(`/projects/${project.id}/milestones`, token, 'POST', { title: 'Persistence project milestone' }, 201);
  await request(`/projects/milestones/${projectMilestone.id}/toggle`, token, 'PATCH');
  const task = await request('/tasks', token, 'POST', { title: 'Persistence task', status: 'todo', priority: 'medium', goal_id: goal.id, project_id: project.id }, 201);
  await request(`/tasks/${task.id}`, token, 'PUT', { title: 'Persisted task', status: 'done' });
  const focusId = randomUUID();
  const focus = { client_session_id: focusId, task_id: task.id, duration: 25, type: 'pomodoro', completed_at: new Date().toISOString() };
  await request('/focus-sessions', token, 'POST', focus, 201);
  await request('/focus-sessions', token, 'POST', focus, 201);
  const journal = await request('/spiritual/journal', token, 'POST', { body: 'Disposable compatibility record', tags: ['persistence-tag'] }, 201);
  const notification = (await db.query("INSERT INTO notifications (user_id,type,title,message) VALUES ($1,'task_due','Disposable verification','Compatibility check') RETURNING id", [accounts[0].id])).rows[0];
  check((await request('/notifications/unread-count', token)).unreadCount === 1, 'Boolean notification unread query');
  await request(`/notifications/${notification.id}/read`, token, 'PUT');
  await request(`/notifications/${notification.id}/read`, other, 'PUT', undefined, 404);
  await db.query("INSERT INTO spiritual_logs (user_id,type,completed,log_date) VALUES ($1,'prayer',TRUE,CURRENT_DATE)", [accounts[0].id]);
  async function verify(phase) {
    const savedPreferences = await request('/preferences', token);
    check(savedPreferences.theme === 'dark' && savedPreferences.onboarded && savedPreferences.focusAreas.length === 0 && savedPreferences.revision === 1, `${phase}: cloud preferences persisted`);
    check((await request(`/preferences?user_id=${accounts[0].id}`, other)).theme === 'light', `${phase}: preferences cannot select another user`);
    check((await request(`/goals/${goal.id}`, token)).title === 'Persisted goal', `${phase}: goal read/update`);
    check((await request(`/projects/${project.id}`, token)).title === 'Persisted project', `${phase}: project read/update`);
    const milestones = await request(`/goals/${goal.id}/milestones`, token);
    check(milestones.some(item => item.id === milestone.id && !!item.completed), `${phase}: milestone completion`);
    check((await request(`/projects/${project.id}/milestones`, token)).some(item => item.id === projectMilestone.id && !!item.completed), `${phase}: project milestone completion`);
    check((await request('/tasks', token)).some(item => item.id === task.id && item.title === 'Persisted task' && item.status === 'done'), `${phase}: task read/update`);
    check((await request(`/tasks/goal/${goal.id}`, token)).some(item => item.id === task.id && item.project_id === project.id), `${phase}: task goal/project relationships`);
    check((await request(`/tasks/project/${project.id}`, token)).some(item => item.id === task.id && item.goal_id === goal.id), `${phase}: project task relationship`);
    const sessions = await request('/focus-sessions', token);
    check(sessions.filter(item => item.id === focusId && item.duration === 25).length === 1, `${phase}: focus session persistence and retry idempotency`);
    check((await request('/spiritual/journal?q=persistence-tag', token)).some(item => item.id === journal.id && item.tags.includes('persistence-tag')), `${phase}: text-array journal write/search`);
    check((await request('/notifications/unread-count', token)).unreadCount === 0, `${phase}: notification boolean update persisted`);
    check((await request('/analytics/spiritual', token)).weeklyData.some(item => item.prayer === 100), `${phase}: boolean analytics aggregation`);
    check(!!(await request('/analytics', token)).productivity, `${phase}: combined analytics SQL compatibility`);
    await request(`/spiritual/journal/${journal.id}`, other, 'GET', undefined, 404);
    for (const path of ['/goals', '/projects', '/tasks', '/focus-sessions']) {
      check((await request(path, other)).length === 0, `${phase}: second user isolated on ${path}`);
      await request(path, null, 'GET', undefined, 401);
    }
    for (const [path, method, body] of [
      [`/goals/${goal.id}`, 'GET'], [`/projects/${project.id}`, 'GET'],
      [`/goals/${goal.id}/milestones`, 'GET'], [`/projects/${project.id}/milestones`, 'GET'],
      [`/tasks/goal/${goal.id}`, 'GET'], [`/tasks/project/${project.id}`, 'GET'],
      [`/goals/${goal.id}`, 'PUT', { title: 'Unauthorized' }],
      [`/projects/${project.id}`, 'PUT', { title: 'Unauthorized' }],
      [`/tasks/${task.id}`, 'PUT', { title: 'Unauthorized' }],
      [`/goals/milestones/${milestone.id}/toggle`, 'PATCH'],
      [`/projects/milestones/${projectMilestone.id}/toggle`, 'PATCH'],
      [`/goals/${goal.id}`, 'DELETE'], [`/projects/${project.id}`, 'DELETE'], [`/tasks/${task.id}`, 'DELETE'],
      ['/tasks', 'POST', { title: 'Unauthorized parent', goal_id: goal.id }],
    ]) await request(path, other, method, body, 404);
    await request('/focus-sessions', other, 'POST', focus, 403);
    await request('/focus-sessions', other, 'POST', { ...focus, task_id: undefined }, 409);
    check((await request('/tasks', token)).some(item => item.id === task.id && item.title === 'Persisted task'), `${phase}: forbidden changes did not modify owner records`);
    checks.push(`${phase}: cross-user reads, updates, deletion and parent-link attacks rejected`);
  }
  await verify('Before restart');
  await stop(); await start();
  token = (await request('/auth/login', null, 'POST', { email: accounts[0].email, password })).data.token;
  await verify('After backend restart');
  for (const [table, recordId] of [['goals', goal.id], ['projects', project.id], ['tasks', task.id], ['focus_sessions', focusId]]) {
    const result = await db.query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE id = $1 AND user_id = $2`, [recordId, accounts[0].id]);
    check(result.rows[0].count === 1, `Direct PostgreSQL ownership/persistence: ${table}`);
  }
  const dashboard = await request('/dashboard/summary?timezone=Africa%2FLagos', token);
  check(!!dashboard.data, 'Live dashboard aggregation');
  await request(`/goals/${goal.id}`, token, 'DELETE');
  await request(`/goals/${goal.id}`, token, 'GET', undefined, 404);
  check(!(await request('/goals', token)).some(item => item.id === goal.id), 'Owner goal deletion persists');
  check((await db.query('SELECT COUNT(*)::int AS count FROM milestones WHERE goal_id = $1', [goal.id])).rows[0].count === 0, 'Goal deletion cascades only its milestones');
  check((await request('/tasks', token)).some(item => item.id === task.id && item.goal_id === null && item.project_id === project.id), 'Goal deletion preserves task and project relationship');
  await request(`/projects/${project.id}`, token, 'DELETE');
  check((await db.query('SELECT COUNT(*)::int AS count FROM project_milestones WHERE project_id = $1', [project.id])).rows[0].count === 0, 'Project deletion cascades its milestones');
  check((await request('/tasks', token)).some(item => item.id === task.id && item.project_id === null), 'Project deletion preserves task');
  await request(`/tasks/${task.id}`, token, 'DELETE');
  check((await request('/focus-sessions', token)).some(item => item.id === focusId && item.task_id === null), 'Task deletion preserves focus history');
  outcome = { status: 'passed', runId, checks };
} catch (error) {
  // Suppress arbitrary driver errors and response bodies. Only our static step labels are safe.
  outcome = { status: 'failed', code: safeErrorCode(error), failedStep: error instanceof VerificationError ? error.message : 'Database or transport operation', completedChecks: checks, runId };
  process.exitCode = 1;
} finally {
  await stop();
  try {
    if (connected && accounts.length) {
      await db.query('BEGIN');
      for (const account of accounts) {
        if (!account.email.startsWith(`tracksense-persistence-${runId}-`) || !account.email.endsWith('@example.test')) throw new VerificationError('Cleanup identity guard');
        const removed = await db.query('DELETE FROM users WHERE id = $1 AND email = $2 RETURNING id', [account.id, account.email]);
        check(removed.rowCount === 1, 'Disposable account removed by exact ID and email');
        for (const table of ['users', 'goals', 'projects', 'tasks', 'focus_sessions', 'journal_entries', 'notifications', 'spiritual_logs', 'account_preferences', 'auth_identities']) {
          const result = await db.query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE ${table === 'users' ? 'id' : 'user_id'} = $1`, [account.id]);
          check(result.rows[0].count === 0, `Cleanup verified: ${table}`);
        }
      }
      await db.query('COMMIT');
    }
    outcome.cleanup = 'passed';
  } catch (error) {
    if (connected) await db.query('ROLLBACK');
    outcome.cleanup = 'failed'; outcome.cleanupCode = safeErrorCode(error); outcome.status = 'failed'; process.exitCode = 1;
  }
  await db.end();
  console.log(JSON.stringify(outcome, null, 2));
}
