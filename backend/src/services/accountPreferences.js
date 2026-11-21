const areas = ['Goals', 'Tasks', 'Study', 'Spiritual', 'Projects', 'Focus'];
const fail = (status, message) => Object.assign(new Error(message), { status });
export function validatePreferences(body) {
  const fields = ['focusAreas', 'onboarded', 'theme', 'revision'];
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !fields.includes(key))) throw fail(400, 'Invalid preference fields');
  if (!Array.isArray(body.focusAreas) || body.focusAreas.length > areas.length || body.focusAreas.some(area => !areas.includes(area)) || new Set(body.focusAreas).size !== body.focusAreas.length) throw fail(400, 'Invalid focus areas');
  if (typeof body.onboarded !== 'boolean' || !['light', 'dark', 'system'].includes(body.theme) || !Number.isSafeInteger(body.revision) || body.revision < 0) throw fail(400, 'Invalid preferences');
  return body;
}
const columns = 'focus_areas AS "focusAreas", onboarded, theme, revision';
export async function readPreferences(query, userId) {
  return (await query(`SELECT ${columns} FROM account_preferences WHERE user_id = $1`, [userId])).rows[0] ?? null;
}
export async function savePreferences(query, userId, input) {
  const value = validatePreferences(input);
  const values = [userId, value.focusAreas, value.onboarded, value.theme];
  const result = value.revision === 0
    ? await query(`INSERT INTO account_preferences (user_id, focus_areas, onboarded, theme) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id) DO NOTHING RETURNING ${columns}`, values)
    : await query(`UPDATE account_preferences SET focus_areas=$2, onboarded=$3, theme=$4, revision=revision+1, updated_at=NOW() WHERE user_id=$1 AND revision=$5 RETURNING ${columns}`, [...values, value.revision]);
  if (!result.rows[0]) throw fail(409, 'Preferences changed on another device. Reload your preferences and try again.');
  return result.rows[0];
}
