import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { loadMigrations, migrate, pendingMigrations } from '../src/database/migrations.js';

// Runs the actual SQL in disposable in-memory PostgreSQL, never DATABASE_URL.
function connection(db) {
  return { query: (sql, params) => params ? db.query(sql, params) : db.exec(sql).then(results => results.at(-1)) };
}

test('fresh schema supports core records and migrations are repeatable', async () => {
  const db = new PGlite();
  try {
    const migrations = await loadMigrations();
    assert.deepEqual(await migrate(connection(db), migrations), ['0001_initial.sql', '0002_identity_preferences.sql', '0003_profile_settings.sql', '0004_study_health.sql', '0005_auth_verification.sql']);
    assert.deepEqual(await migrate(connection(db), migrations), []);
    const user = (await db.query("INSERT INTO users (name,email,password_hash) VALUES ('Test','test@example.test','fixture') RETURNING id")).rows[0];
    const course = (await db.query("INSERT INTO courses (user_id,name,credits,status,topics,modules) VALUES ($1,'Study',3,'active',$2,$3) RETURNING *", [user.id, JSON.stringify([{ id: 't1', title: 'Arrays', completed: false }]), JSON.stringify([{ id: 'm1', title: 'Foundations', isCompleted: false }])])).rows[0];
    assert.equal(course.topics[0].title, 'Arrays');
    assert.equal(course.modules[0].isCompleted, false);
    const scored = (await db.query("INSERT INTO assignments (user_id,course_id,title,due_date,earned_score,total_score) VALUES ($1,$2,'Quiz',NOW(),8,10) RETURNING *", [user.id, course.id])).rows[0];
    assert.equal(scored.earned_score, '8.00');
    assert.equal(scored.total_score, '10.00');
    const goal = (await db.query("INSERT INTO goals (user_id,title,category,status) VALUES ($1,'Learn','personal','active') RETURNING id", [user.id])).rows[0];
    await db.query('UPDATE goals SET updated_at = NOW() WHERE id = $1', [goal.id]);
    const task = (await db.query("INSERT INTO tasks (user_id,goal_id,title,priority,status,is_recurring,recur_pattern) VALUES ($1,$2,'Read','medium','todo','1',$3) RETURNING *", [user.id, goal.id, JSON.stringify({ frequency: 'daily' })])).rows[0];
    assert.equal(task.is_recurring, true);
    assert.equal(task.recur_pattern.frequency, 'daily');
    await db.query("INSERT INTO focus_sessions (user_id,task_id,type,duration,completed_at) VALUES ($1,$2,'pomodoro',25,NOW())", [user.id, task.id]);
    await assert.rejects(db.query("INSERT INTO tasks (user_id,title,priority,status) VALUES ($1,'Invalid','invalid','todo')", [user.id]), { code: '23514' });
    await db.query('DELETE FROM users WHERE id = $1', [user.id]);
    assert.equal((await db.query('SELECT COUNT(*)::int AS count FROM tasks')).rows[0].count, 0);
    assert.equal((await db.query('SELECT COUNT(*)::int AS count FROM focus_sessions')).rows[0].count, 0);
  } finally { await db.close(); }
});

test('existing unversioned records survive refused initialization', async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE TABLE users (id TEXT PRIMARY KEY); INSERT INTO users VALUES ('existing-account')");
    await assert.rejects(migrate(connection(db), await loadMigrations()), /initialization was refused/);
    assert.deepEqual((await db.query('SELECT id FROM users')).rows, [{ id: 'existing-account' }]);
    assert.equal((await db.query("SELECT to_regclass('public.tracksense_migrations') AS table_name")).rows[0].table_name, null);
  } finally { await db.close(); }
});

test('failed migration rolls back schema and history together', async () => {
  const db = new PGlite();
  try {
    const broken = [{ name: '0001_bad.sql', checksum: 'fixture', sql: 'CREATE TABLE partial (id INT); SELECT * FROM nonexistent_table;' }];
    await assert.rejects(migrate(connection(db), broken), { code: '42P01' });
    assert.equal((await db.query("SELECT to_regclass('public.partial') AS table_name")).rows[0].table_name, null);
    assert.equal((await db.query("SELECT to_regclass('public.tracksense_migrations') AS table_name")).rows[0].table_name, null);
  } finally { await db.close(); }
});

test('changed, unknown or reordered history is rejected', () => {
  const files = [{ name: '0001_one.sql', checksum: 'one' }, { name: '0002_two.sql', checksum: 'two' }];
  assert.deepEqual(pendingMigrations(files, [files[0]]), [files[1]]);
  for (const history of [[{ ...files[0], checksum: 'changed' }], [files[1]], [...files, { name: '0003_unknown.sql' }]]) {
    assert.throws(() => pendingMigrations(files, history), /history differs/);
  }
});

test('identity/preferences upgrade preserves existing users, goals and migration history', async () => {
  const db = new PGlite();
  try {
    const migrations = await loadMigrations();
    await migrate(connection(db), migrations.slice(0, 1));
    const user = (await db.query("INSERT INTO users (name,email,password_hash) VALUES ('Existing','existing@example.test','fixture') RETURNING *")).rows[0];
    const goal = (await db.query("INSERT INTO goals (user_id,title,category,status) VALUES ($1,'Existing goal','Personal','active') RETURNING *", [user.id])).rows[0];
    assert.deepEqual(await migrate(connection(db), migrations), ['0002_identity_preferences.sql', '0003_profile_settings.sql', '0004_study_health.sql', '0005_auth_verification.sql']);
    assert.deepEqual((await db.query('SELECT * FROM users WHERE id=$1', [user.id])).rows[0], { ...user, bio: '', is_verified: true });
    assert.deepEqual((await db.query('SELECT * FROM goals WHERE id=$1', [goal.id])).rows[0], goal);
    assert.deepEqual(await migrate(connection(db), migrations), []);
  } finally { await db.close(); }
});
