import { validateFields } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';

export const getStudySessionsByUser = async (userId) => {
  const res = await query(
    'SELECT * FROM study_sessions WHERE user_id = $1 ORDER BY session_date DESC',
    [userId]
  );
  return res.rows;
};

export const createStudySession = async (userId, subject, duration_minutes, session_date, notes) => {
  const res = await query(
    `INSERT INTO study_sessions (user_id, subject, duration_minutes, session_date, notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, subject, duration_minutes || 0, session_date, notes || null]
  );
  return res.rows[0];
};

export const updateStudySession = async (id, fields, userId) => {
  validateFields(fields, ['subject', 'duration_minutes', 'session_date', 'notes']);
  const sets = [];
  const values = [];
  let idx = 1;
  for (const key in fields) {
    sets.push(`${key} = $${idx}`);
    values.push(fields[key]);
    idx++;
  }
  values.push(id, userId);
  const sql = `UPDATE study_sessions SET ${sets.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
};

export const deleteStudySession = async (id, userId) => {
  await query('DELETE FROM study_sessions WHERE id = $1 AND user_id = $2', [id, userId]);
};

export const getWeeklyStudyHours = async (userId, startDate, endDate) => {
  const res = await query(
    `SELECT DATE(session_date) as date, SUM(duration_minutes)::INT as minutes
     FROM study_sessions
     WHERE user_id = $1 AND session_date >= $2 AND session_date <= $3
     GROUP BY DATE(session_date)
     ORDER BY DATE(session_date) ASC`,
    [userId, startDate, endDate]
  );
  return res.rows.map((row) => ({
    date: row.date,
    hours: Math.round(row.minutes / 60 * 10) / 10,
  }));
};
