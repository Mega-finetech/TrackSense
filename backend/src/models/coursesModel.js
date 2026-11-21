import { validateFields } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';

export const getCoursesByUser = async (userId) => {
  const res = await query(
    'SELECT * FROM courses WHERE user_id = $1 ORDER BY name ASC',
    [userId]
  );
  return res.rows;
};

export const getCourseById = async (id) => {
  const res = await query('SELECT * FROM courses WHERE id = $1', [id]);
  return res.rows[0];
};

export const createCourse = async (userId, name, code, credits, status, topics = [], modules = []) => {
  const res = await query(
    `INSERT INTO courses (user_id, name, code, credits, status, topics, modules)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, name, code, credits || 0, status || 'active', JSON.stringify(topics), JSON.stringify(modules)]
  );
  return res.rows[0];
};

export const updateCourse = async (id, fields, userId) => {
  validateFields(fields, ['name', 'code', 'credits', 'status', 'topics', 'modules']);
  const sets = [];
  const values = [];
  let idx = 1;
  for (const key in fields) {
    sets.push(`${key} = $${idx}`);
    values.push(['topics', 'modules'].includes(key) ? JSON.stringify(fields[key]) : fields[key]);
    idx++;
  }
  values.push(id, userId);
  const sql = `UPDATE courses SET ${sets.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
};

export const deleteCourse = async (id, userId) => {
  await query('DELETE FROM courses WHERE id = $1 AND user_id = $2', [id, userId]);
};
