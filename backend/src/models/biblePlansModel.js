import { validateFields } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';

export const getBiblePlansByUser = async (userId) => {
  const res = await query(
    'SELECT * FROM bible_study_plans WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return res.rows;
};

export const getBiblePlanById = async (id) => {
  const res = await query('SELECT * FROM bible_study_plans WHERE id = $1', [id]);
  return res.rows[0];
};

export const createBiblePlan = async (userId, title, total_chapters, chapters_per_day, start_date) => {
  const res = await query(
    `INSERT INTO bible_study_plans (user_id, title, total_chapters, chapters_per_day, start_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, title, total_chapters, chapters_per_day, start_date]
  );
  return res.rows[0];
};

export const updateBiblePlan = async (id, fields, userId) => {
  validateFields(fields, ['title', 'total_chapters', 'chapters_per_day', 'start_date', 'status']);
  const sets = [];
  const values = [];
  let idx = 1;

  for (const key in fields) {
    sets.push(`${key} = $${idx}`);
    values.push(fields[key]);
    idx++;
  }

  values.push(id, userId);
  const sql = `UPDATE bible_study_plans SET ${sets.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
};

export const deleteBiblePlan = async (id, userId) => {
  await query('DELETE FROM bible_study_plans WHERE id = $1 AND user_id = $2', [id, userId]);
};

export const getPlanEntries = async (planId) => {
  const res = await query(
    'SELECT * FROM bible_study_entries WHERE plan_id = $1 ORDER BY day_date ASC',
    [planId]
  );
  return res.rows;
};

export const getPlanEntryByDate = async (planId, dayDate) => {
  const res = await query(
    'SELECT * FROM bible_study_entries WHERE plan_id = $1 AND day_date = $2',
    [planId, dayDate]
  );
  return res.rows[0];
};

export const upsertPlanEntry = async (planId, dayDate, completed, notes) => {
  const existing = await getPlanEntryByDate(planId, dayDate);
  if (existing) {
    const res = await query(
      `UPDATE bible_study_entries SET completed = $1, notes = $2 WHERE id = $3 RETURNING *`,
      [completed, notes || null, existing.id]
    );
    return res.rows[0];
  }
  const res = await query(
    `INSERT INTO bible_study_entries (plan_id, day_date, completed, notes)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [planId, dayDate, completed, notes || null]
  );
  return res.rows[0];
};
