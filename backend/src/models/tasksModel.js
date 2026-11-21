import { validateFields } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';

export const getTasksByUser = async (userId, filters = {}) => {
  let sql = 'SELECT * FROM tasks WHERE user_id = $1';
  const params = [userId];
  let paramIdx = 2;

  if (filters.status) {
    sql += ` AND status = $${paramIdx}`;
    params.push(filters.status);
    paramIdx++;
  }
  if (filters.priority) {
    sql += ` AND priority = $${paramIdx}`;
    params.push(filters.priority);
    paramIdx++;
  }
  if (filters.due_date_from) {
    sql += ` AND due_date >= $${paramIdx}`;
    params.push(filters.due_date_from);
    paramIdx++;
  }
  if (filters.due_date_to) {
    sql += ` AND due_date <= $${paramIdx}`;
    params.push(filters.due_date_to);
    paramIdx++;
  }
  if (filters.goal_id) {
    sql += ` AND goal_id = $${paramIdx}`;
    params.push(filters.goal_id);
    paramIdx++;
  }
  if (filters.project_id) {
    sql += ` AND project_id = $${paramIdx}`;
    params.push(filters.project_id);
    paramIdx++;
  }

  sql += ' ORDER BY due_date ASC, created_at DESC';
  const res = await query(sql, params);
  return res.rows;
};

export const getTaskById = async (id) => {
  const res = await query('SELECT * FROM tasks WHERE id = $1', [id]);
  return res.rows[0];
};

export const createTask = async (
  userId,
  title,
  description,
  status,
  priority,
  due_date,
  goal_id,
  project_id,
  is_recurring = false,
  recur_pattern = null
) => {
  const res = await query(
    `INSERT INTO tasks (user_id, title, description, status, priority, due_date, goal_id, project_id, is_recurring, recur_pattern)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      userId,
      title,
      description,
      status || 'todo',
      priority || 'medium',
      due_date || null,
      goal_id || null,
      project_id || null,
      is_recurring ? '1' : '0',
      recur_pattern,
    ]
  );
  return res.rows[0];
};

export const updateTask = async (id, fields, userId) => {
  validateFields(fields, ['title', 'description', 'priority', 'status', 'due_date', 'goal_id', 'project_id', 'is_recurring', 'recur_pattern']);
  const sets = [];
  const values = [];
  let idx = 1;
  for (const key in fields) {
    sets.push(`${key} = $${idx}`);
    values.push(key === 'is_recurring' ? (fields[key] ? '1' : '0') : fields[key]);
    idx++;
  }
  values.push(id, userId);
  const sql = `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
};

export const deleteTask = async (id, userId) => {
  await query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
};

export const getTasksByGoal = async (userId, goalId) => {
  const res = await query(
    'SELECT * FROM tasks WHERE user_id = $1 AND goal_id = $2 ORDER BY due_date ASC',
    [userId, goalId]
  );
  return res.rows;
};

export const getTasksByProject = async (userId, projectId) => {
  const res = await query(
    'SELECT * FROM tasks WHERE user_id = $1 AND project_id = $2 ORDER BY due_date ASC',
    [userId, projectId]
  );
  return res.rows;
};
