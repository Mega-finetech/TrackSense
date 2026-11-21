import { query } from '../utils/db.js';

export async function getDashboardSummary(req, res) {
  const userId = req.user.id;
  const timezone = typeof req.query.timezone === 'string' ? req.query.timezone : 'UTC';
  try { new Intl.DateTimeFormat('en', { timeZone: timezone }); }
  catch { return res.status(400).json({ error: 'Invalid timezone' }); }
  const [tasks, goals, study, focus, streak] = await Promise.all([
    query(`SELECT * FROM tasks WHERE user_id = $1 AND status <> 'archived'
      AND (due_date::timestamptz AT TIME ZONE $2)::date = (NOW() AT TIME ZONE $2)::date
      ORDER BY due_date::timestamptz, created_at::timestamptz`, [userId, timezone]),
    query("SELECT id, title, progress, category FROM goals WHERE user_id = $1 AND status = 'active' ORDER BY created_at::timestamptz DESC", [userId]),
    query(`SELECT COALESCE(SUM(duration_minutes), 0)::int AS minutes FROM study_sessions
      WHERE user_id = $1 AND session_date::date >= date_trunc('week', NOW() AT TIME ZONE $2)::date
      AND session_date::date <= (NOW() AT TIME ZONE $2)::date`, [userId, timezone]),
    query(`SELECT COALESCE(SUM(duration), 0)::int AS minutes FROM focus_sessions
      WHERE user_id = $1 AND (completed_at::timestamptz AT TIME ZONE $2)::date = (NOW() AT TIME ZONE $2)::date`, [userId, timezone]),
    query("SELECT current_count FROM streaks WHERE user_id = $1 AND type = 'prayer' LIMIT 1", [userId]),
  ]);
  res.json({ success: true, data: {
    tasksDueToday: tasks.rows.filter(task => task.status !== 'done').length,
    completedTodayTasks: tasks.rows.filter(task => task.status === 'done').length,
    totalTodayTasks: tasks.rows.length,
    activeGoals: goals.rows.length,
    studyHoursThisWeek: Math.round(study.rows[0].minutes / 6) / 10,
    focusMinutesToday: focus.rows[0].minutes,
    prayerStreak: streak.rows[0]?.current_count || 0,
    upcomingTasks: tasks.rows,
    goalsProgress: goals.rows,
  } });
}
