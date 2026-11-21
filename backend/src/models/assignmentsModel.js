import { validateFields } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';

export const getAssignmentsByUser = async (userId) => {
  const res = await query(
    `SELECT a.*, c.name as course_name FROM assignments a
     LEFT JOIN courses c ON a.course_id = c.id AND c.user_id = a.user_id
     WHERE a.user_id = $1
     ORDER BY a.due_date ASC`,
    [userId]
  );
  return res.rows;
};

export const getAssignmentById = async (id) => {
  const res = await query(
    `SELECT a.*, c.name as course_name FROM assignments a
     LEFT JOIN courses c ON a.course_id = c.id AND c.user_id = a.user_id
     WHERE a.id = $1`,
    [id]
  );
  return res.rows[0];
};

export const createAssignment = async (userId, courseId, title, due_date, weight, status, earnedScore, totalScore) => {
  const res = await query(
    `INSERT INTO assignments (user_id, course_id, title, due_date, weight, status, earned_score, total_score)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [userId, courseId, title, due_date || null, weight || null, status || 'pending', earnedScore ?? null, totalScore ?? null]
  );
  return res.rows[0];
};

export const updateAssignment = async (id, fields, userId) => {
  validateFields(fields, ['course_id', 'title', 'due_date', 'weight', 'grade', 'status', 'earned_score', 'total_score']);
  const sets = [];
  const values = [];
  let idx = 1;
  for (const key in fields) {
    sets.push(`${key} = $${idx}`);
    values.push(fields[key]);
    idx++;
  }
  values.push(id, userId);
  const sql = `UPDATE assignments SET ${sets.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
};

export const deleteAssignment = async (id, userId) => {
  await query('DELETE FROM assignments WHERE id = $1 AND user_id = $2', [id, userId]);
};

export const getAssignmentsByCourse = async (courseId, userId) => {
  const res = await query(
    'SELECT * FROM assignments WHERE course_id = $1 AND user_id = $2 ORDER BY due_date ASC',
    [courseId, userId]
  );
  return res.rows;
};
