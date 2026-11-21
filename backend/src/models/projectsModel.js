import { validateFields } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';

export const getProjectsByUser = async (userId) => {
  const res = await query(
    'SELECT * FROM projects WHERE user_id = $1 ORDER BY deadline NULLS LAST, created_at DESC',
    [userId]
  );
  return res.rows;
};

export const getProjectById = async (id) => {
  const res = await query('SELECT * FROM projects WHERE id = $1', [id]);
  return res.rows[0];
};

export const createProject = async (userId, title, description, status, deadline, notes) => {
  const res = await query(
    `INSERT INTO projects (user_id, title, description, status, deadline, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, title, description || null, status || 'planning', deadline || null, notes || null]
  );
  return res.rows[0];
};

export const updateProject = async (id, fields, userId) => {
  validateFields(fields, ['title', 'description', 'status', 'deadline', 'notes']);
  const sets = [];
  const values = [];
  let idx = 1;

  for (const key in fields) {
    sets.push(`${key} = $${idx}`);
    values.push(fields[key]);
    idx++;
  }

  values.push(id, userId);
  const sql = `UPDATE projects SET ${sets.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
};

export const deleteProject = async (id, userId) => {
  await query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [id, userId]);
};

export const countProjectTasks = async (projectId) => {
  const res = await query('SELECT COUNT(*)::int AS total FROM tasks WHERE project_id = $1', [projectId]);
  return res.rows[0].total;
};

export const countCompletedProjectTasks = async (projectId) => {
  const res = await query(
    "SELECT COUNT(*)::int AS completed FROM tasks WHERE project_id = $1 AND status = 'done'",
    [projectId]
  );
  return res.rows[0].completed;
};
