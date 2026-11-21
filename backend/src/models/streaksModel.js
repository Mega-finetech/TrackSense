import { query } from '../utils/db.js';

export const getStreakByType = async (userId, type) => {
  const res = await query(
    'SELECT * FROM streaks WHERE user_id = $1 AND type = $2',
    [userId, type]
  );
  return res.rows[0];
};

export const getStreaksByUser = async (userId) => {
  const res = await query(
    'SELECT * FROM streaks WHERE user_id = $1 ORDER BY type ASC',
    [userId]
  );
  return res.rows;
};

export const upsertStreak = async (userId, type, currentCount, longestCount, lastDate) => {
  const existing = await getStreakByType(userId, type);

  if (existing) {
    const res = await query(
      `UPDATE streaks SET current_count = $1, longest_count = $2, last_date = $3 WHERE id = $4 RETURNING *`,
      [currentCount, longestCount, lastDate, existing.id]
    );
    return res.rows[0];
  }

  const res = await query(
    `INSERT INTO streaks (user_id, type, current_count, longest_count, last_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, type, currentCount, longestCount, lastDate]
  );
  return res.rows[0];
};

export const updateStreak = async (userId, type, targetDate = null) => {
  const today = targetDate ? new Date(targetDate) : new Date();
  const currentDate = new Date(today.toISOString().split('T')[0]);
  const isoDate = currentDate.toISOString().split('T')[0];
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const isoYesterday = yesterday.toISOString().split('T')[0];

  const existing = await getStreakByType(userId, type);
  if (existing?.last_date === isoDate) {
    return existing;
  }

  const newCount = existing && existing.last_date === isoYesterday ? existing.current_count + 1 : 1;
  const newLongest = existing ? Math.max(existing.longest_count, newCount) : newCount;
  return upsertStreak(userId, type, newCount, newLongest, isoDate);
};
