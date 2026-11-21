import { query } from '../utils/db.js';

export const getSpiritualLogs = async (userId, type, startDate, endDate) => {
  const res = await query(
    `SELECT * FROM spiritual_logs
     WHERE user_id = $1 AND type = $2 AND log_date BETWEEN $3 AND $4
     ORDER BY log_date ASC`,
    [userId, type, startDate, endDate]
  );
  return res.rows;
};

export const getSpiritualLogByDate = async (userId, type, logDate) => {
  const res = await query(
    'SELECT * FROM spiritual_logs WHERE user_id = $1 AND type = $2 AND log_date = $3',
    [userId, type, logDate]
  );
  return res.rows[0];
};

export const upsertSpiritualLog = async (userId, type, logDate, notes, details) => {
  const existing = await getSpiritualLogByDate(userId, type, logDate);

  if (existing) {
    const res = await query(
      `UPDATE spiritual_logs SET notes = $1, details = $2 WHERE id = $3 RETURNING *`,
      [notes || null, details || null, existing.id]
    );
    return res.rows[0];
  }

  const res = await query(
    `INSERT INTO spiritual_logs (user_id, type, log_date, notes, details)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, type, logDate, notes || null, details || null]
  );
  return res.rows[0];
};
