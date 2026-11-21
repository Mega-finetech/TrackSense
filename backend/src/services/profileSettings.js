export const notificationKeys = ['task_due', 'exam_soon', 'streak_risk', 'goal_deadline', 'assignment_overdue', 'focus_sessions', 'weekly_review'];
const fail = (message) => Object.assign(new Error(message), { status: 400 });
export function validateProfile(body) {
  if (!body || Object.keys(body).some(key => !['name', 'bio', 'avatar_url'].includes(key))) throw fail('Only name, bio and photo can be updated here.');
  if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 100) throw fail('Name must contain 2–100 characters.');
  if (body.bio !== undefined && (typeof body.bio !== 'string' || body.bio.length > 500)) throw fail('Bio must be 500 characters or fewer.');
  if (body.avatar_url !== undefined && body.avatar_url !== null) {
    let url; try { url = new URL(body.avatar_url); } catch { throw fail('Invalid photo URL.'); }
    if (url.protocol !== 'https:' || url.username || url.password || body.avatar_url.length > 2048) throw fail('Invalid photo URL.');
  }
  return { name: body.name.trim(), bio: body.bio ?? '', avatar_url: body.avatar_url };
}
export async function readProfile(query, userId) {
  return (await query('SELECT id,name,email,avatar_url,bio FROM users WHERE id=$1', [userId])).rows[0];
}
export async function saveProfile(query, userId, body) {
  const value = validateProfile(body);
  const existing = await readProfile(query, userId);
  if (!existing) throw Object.assign(new Error('Account not found.'), { status: 404 });
  return (await query('UPDATE users SET name=$2,bio=$3,avatar_url=$4 WHERE id=$1 RETURNING id,name,email,avatar_url,bio', [userId,value.name,value.bio,value.avatar_url === undefined ? existing.avatar_url : value.avatar_url])).rows[0];
}
export async function readNotifications(query, userId) {
  await query('INSERT INTO notification_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId]);
  return (await query(`SELECT ${notificationKeys.join(',')} FROM notification_preferences WHERE user_id=$1`, [userId])).rows[0];
}
export async function saveNotifications(query, userId, body) {
  if (!body || !Object.keys(body).length || Object.entries(body).some(([key,value]) => !notificationKeys.includes(key) || typeof value !== 'boolean')) throw fail('Notification preferences must be boolean values.');
  await readNotifications(query, userId);
  const entries = Object.entries(body);
  await query(`UPDATE notification_preferences SET ${entries.map(([key],i) => `${key}=$${i+2}`).join(',')},updated_at=NOW() WHERE user_id=$1`, [userId,...entries.map(([,value]) => value)]);
  return readNotifications(query,userId);
}
export async function exportProfileData(query, userId) {
  const result = { exportedAt: new Date().toISOString(), user: await readProfile(query,userId) };
  // Static table list, never interpolated from request input. No credentials exported.
  for (const table of ['goals','tasks','projects','courses','study_sessions','focus_sessions','spiritual_logs','journal_entries','assignments','exams','streaks','bible_study_plans','notifications','notification_preferences','user_settings','account_preferences']) {
    result[table] = (await query(`SELECT * FROM ${table} WHERE user_id=$1`,[userId])).rows;
  }
  for (const [table,parent,key] of [['milestones','goals','goal_id'],['project_milestones','projects','project_id'],['bible_study_entries','bible_study_plans','plan_id']]) {
    result[table] = (await query(`SELECT child.* FROM ${table} child JOIN ${parent} parent ON child.${key}=parent.id WHERE parent.user_id=$1`,[userId])).rows;
  }
  return result;
}
