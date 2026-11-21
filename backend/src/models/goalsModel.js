import { validateFields } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';

export const getGoalsByUser = async (userId) => {
  const res = await query('SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return res.rows;
};

export const getGoalById = async (id) => {
  const res = await query('SELECT * FROM goals WHERE id = $1', [id]);
  return res.rows[0];
};

export const createGoal = async (userId, title, description, category, status, deadline) => {
  const res = await query(
    `INSERT INTO goals (user_id, title, description, category, status, deadline)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [userId, title, description, category, status, deadline]
  );
  return res.rows[0];
};

export const updateGoal = async (id, fields, userId) => {
  validateFields(fields, ['title', 'description', 'category', 'status', 'deadline']);
  const sets = [];
  const values = [];
  let idx = 1;
  for (const key in fields) {
    sets.push(`${key} = $${idx}`);
    values.push(fields[key]);
    idx++;
  }
  values.push(id, userId);
  const sql = `UPDATE goals SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
};

export const deleteGoal = async (id, userId) => {
  await query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [id, userId]);
};

export const setGoalProgress = async (goalId, progress) => {
  const res = await query('UPDATE goals SET progress = $1 WHERE id = $2 RETURNING *', [progress, goalId]);
  return res.rows[0];
};
