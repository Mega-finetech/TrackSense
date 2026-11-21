import { validateFields } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';

export const getExamsByUser = async (userId) => {
  const res = await query(
    `SELECT e.*, c.name as course_name FROM exams e
     LEFT JOIN courses c ON e.course_id = c.id AND c.user_id = e.user_id
     WHERE e.user_id = $1
     ORDER BY e.exam_date ASC`,
    [userId]
  );
  return res.rows;
};

export const getExamById = async (id) => {
  const res = await query(
    `SELECT e.*, c.name as course_name FROM exams e
     LEFT JOIN courses c ON e.course_id = c.id AND c.user_id = e.user_id
     WHERE e.id = $1`,
    [id]
  );
  return res.rows[0];
};

export const createExam = async (userId, courseId, subject, exam_date, location) => {
  const res = await query(
    `INSERT INTO exams (user_id, course_id, subject, exam_date, location)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, courseId, subject, exam_date, location || null]
  );
  return res.rows[0];
};

export const updateExam = async (id, fields, userId) => {
  validateFields(fields, ['course_id', 'subject', 'exam_date', 'location']);
  const sets = [];
  const values = [];
  let idx = 1;
  for (const key in fields) {
    sets.push(`${key} = $${idx}`);
    values.push(fields[key]);
    idx++;
  }
  values.push(id, userId);
  const sql = `UPDATE exams SET ${sets.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
};

export const deleteExam = async (id, userId) => {
  await query('DELETE FROM exams WHERE id = $1 AND user_id = $2', [id, userId]);
};

export const getExamsByCourse = async (courseId, userId) => {
  const res = await query(
    'SELECT * FROM exams WHERE course_id = $1 AND user_id = $2 ORDER BY exam_date ASC',
    [courseId, userId]
  );
  return res.rows;
};
