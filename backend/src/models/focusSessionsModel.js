import { saveFocusSession } from '../services/saveFocusSession.js';
import { query } from '../utils/db.js';
import { randomUUID } from 'node:crypto';

export const createFocusSession = (userId, taskId, type, duration, completedAt, sessionId = randomUUID()) =>
  saveFocusSession(query, { userId, taskId, type, duration, completedAt: completedAt || new Date().toISOString(), sessionId });

export const getFocusSessionsByUser = async (userId) => {
  const res = await query(
    `SELECT fs.*, t.title AS task_title
     FROM focus_sessions fs
     LEFT JOIN tasks t ON fs.task_id = t.id AND t.user_id = fs.user_id
     WHERE fs.user_id = $1
     ORDER BY fs.completed_at DESC
     LIMIT 50`,
    [userId]
  );
  return res.rows;
};

export const getTodayFocusStats = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const stats = await query(
    `SELECT
      COALESCE(SUM(duration)::int, 0) AS total_focus_minutes,
      SUM(CASE WHEN type = 'pomodoro' THEN 1 ELSE 0 END)::int AS pomodoros_completed,
      COUNT(DISTINCT CASE WHEN task_id IS NOT NULL THEN task_id END)::int AS tasks_worked
     FROM focus_sessions
     WHERE user_id = $1
       AND completed_at::DATE = $2::DATE`,
    [userId, today]
  );

  const tasks = await query(
    `SELECT DISTINCT t.id, t.title
     FROM focus_sessions fs
     JOIN tasks t ON t.id = fs.task_id AND t.user_id = fs.user_id
     WHERE fs.user_id = $1
       AND fs.completed_at::DATE = $2::DATE
       AND fs.task_id IS NOT NULL`,
    [userId, today]
  );

  return { ...stats.rows[0], tasks: tasks.rows };
};

export const getAnalytics = async (userId) => {
  const now = new Date();
  const sixDaysAgo = new Date(now);
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
  const sixDaysAgoStr = sixDaysAgo.toISOString().split('T')[0];

  const weeklyRes = await query(
    `SELECT EXTRACT(DOW FROM completed_at::TIMESTAMPTZ)::int AS dow,
            COALESCE(SUM(duration)::int,0) AS minutes
     FROM focus_sessions
     WHERE user_id = $1
       AND completed_at >= $2
     GROUP BY EXTRACT(DOW FROM completed_at::TIMESTAMPTZ)`,
    [userId, sixDaysAgoStr]
  );

  const bestDayRes = await query(
    `SELECT EXTRACT(DOW FROM completed_at::TIMESTAMPTZ)::int AS dow,
            COALESCE(SUM(duration)::int,0) AS minutes
     FROM focus_sessions
     WHERE user_id = $1
     GROUP BY EXTRACT(DOW FROM completed_at::TIMESTAMPTZ)
     ORDER BY minutes DESC
     LIMIT 1`,
    [userId]
  );

  const bestHourRes = await query(
    `SELECT EXTRACT(HOUR FROM completed_at::TIMESTAMPTZ)::int AS hour,
            COALESCE(SUM(duration)::int,0) AS minutes
     FROM focus_sessions
     WHERE user_id = $1
     GROUP BY EXTRACT(HOUR FROM completed_at::TIMESTAMPTZ)
     ORDER BY minutes DESC
     LIMIT 1`,
    [userId]
  );

  const datesRes = await query(
    `SELECT DISTINCT completed_at::DATE AS d
     FROM focus_sessions
     WHERE user_id = $1
     ORDER BY d DESC`,
    [userId]
  );

  const topTasksRes = await query(
    `SELECT fs.task_id, t.title, COALESCE(SUM(fs.duration)::int,0) AS minutes
     FROM focus_sessions fs
     LEFT JOIN tasks t ON t.id = fs.task_id AND t.user_id = fs.user_id
     WHERE fs.user_id = $1 AND fs.task_id IS NOT NULL
     GROUP BY fs.task_id, t.title
     ORDER BY minutes DESC
     LIMIT 6`,
    [userId]
  );

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const monthlyRes = await query(
    `SELECT COALESCE(SUM(duration)::int,0) AS total_minutes
     FROM focus_sessions
     WHERE user_id = $1
       AND completed_at >= $2`,
    [userId, firstOfMonth]
  );

  const fortyTwoDaysAgo = new Date(now);
  fortyTwoDaysAgo.setDate(fortyTwoDaysAgo.getDate() - 42);
  const fortyTwoDaysAgoStr = fortyTwoDaysAgo.toISOString().split('T')[0];

  const productiveWeekRes = await query(
    `SELECT (completed_at::DATE - EXTRACT(DOW FROM completed_at::TIMESTAMPTZ)::int)::TEXT AS week_start,
            COALESCE(SUM(duration)::int,0) AS minutes
     FROM focus_sessions
     WHERE user_id = $1
       AND completed_at >= $2
     GROUP BY week_start
     ORDER BY minutes DESC
     LIMIT 1`,
    [userId, fortyTwoDaysAgoStr]
  );

  return {
    weekly: weeklyRes.rows,
    bestDay: bestDayRes.rows[0] || null,
    bestHour: bestHourRes.rows[0] || null,
    sessionDates: datesRes.rows.map((r) => r.d),
    topTasks: topTasksRes.rows,
    monthly: monthlyRes.rows[0] || { total_minutes: 0 },
    productiveWeek: productiveWeekRes.rows[0] || null,
  };
};
