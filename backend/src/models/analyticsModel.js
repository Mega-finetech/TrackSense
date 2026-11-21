import { query } from '../utils/db.js';

const getDateRange = (rangeType) => {
  const today = new Date();
  let startDate, endDate = today;

  if (rangeType === 'week') {
    startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay());
  } else if (rangeType === 'month') {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (rangeType === 'threeMonths') {
    startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 3);
  } else if (typeof rangeType === 'object' && rangeType?.start && rangeType?.end) {
    startDate = new Date(rangeType.start);
    endDate = new Date(rangeType.end);
  } else {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
};

export const getProductivityOverview = async (userId, dateRange) => {
  const { start, end } = getDateRange(dateRange);

  const weeklyRes = await query(
    `SELECT (due_date::DATE - EXTRACT(DOW FROM due_date::TIMESTAMPTZ)::int)::TEXT AS week_start,
            COUNT(*)::int AS count
     FROM tasks
     WHERE user_id = $1
       AND status = 'done'
       AND due_date::DATE >= $2::DATE
       AND due_date::DATE <= $3::DATE
     GROUP BY week_start
     ORDER BY week_start`,
    [userId, start, end]
  );

  const rateRes = await query(
    `SELECT SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)::int AS completed,
            COUNT(*)::int AS total
     FROM tasks
     WHERE user_id = $1
       AND due_date::DATE >= $2::DATE
       AND due_date::DATE <= $3::DATE`,
    [userId, start, end]
  );

  const rate = rateRes.rows[0];
  const completionRate = rate.total > 0 ? Math.round((rate.completed / rate.total) * 100) : 0;

  return {
    weeklyData: weeklyRes.rows.map((r) => ({
      week: r.week_start,
      completed: r.count,
    })),
    completionRate,
    totalCompleted: rate.completed,
    totalTasks: rate.total,
  };
};

export const getGoalProgress = async (userId, dateRange) => {
  const { start } = getDateRange(dateRange);

  const activeRes = await query(
    `SELECT id, title, progress, category
     FROM goals
     WHERE user_id = $1
       AND status IN ('active', 'completed')
     ORDER BY progress DESC`,
    [userId]
  );

  const firstOfMonth = new Date().toISOString().split('T')[0].slice(0, 7);

  const completedRes = await query(
    `SELECT COUNT(*)::int AS count
     FROM goals
     WHERE user_id = $1
       AND status = 'completed'
       AND TO_CHAR(created_at::TIMESTAMPTZ, 'YYYY-MM') = $2`,
    [userId, firstOfMonth]
  );

  return {
    activeGoals: activeRes.rows,
    completedThisMonth: completedRes.rows[0]?.count || 0,
  };
};

export const getStudyAnalytics = async (userId, dateRange) => {
  const { start, end } = getDateRange(dateRange);

  const subjectRes = await query(
    `SELECT subject, SUM(duration_minutes)::int AS minutes
     FROM study_sessions
     WHERE user_id = $1
       AND session_date::DATE >= $2::DATE
       AND session_date::DATE <= $3::DATE
     GROUP BY subject
     ORDER BY minutes DESC`,
    [userId, start, end]
  );

  const weeklyRes = await query(
    `SELECT (session_date::DATE - EXTRACT(DOW FROM session_date::TIMESTAMPTZ)::int)::TEXT AS week_start,
            COUNT(*)::int AS sessions
     FROM study_sessions
     WHERE user_id = $1
       AND session_date::DATE >= $2::DATE
       AND session_date::DATE <= $3::DATE
     GROUP BY week_start
     ORDER BY week_start`,
    [userId, start, end]
  );

  return {
    hoursPerSubject: subjectRes.rows.map((r) => ({
      subject: r.subject,
      hours: Math.round((r.minutes / 60) * 100) / 100,
      minutes: r.minutes,
    })),
    sessionsPerWeek: weeklyRes.rows.map((r) => ({
      week: r.week_start,
      sessions: r.sessions,
    })),
  };
};

export const getSpiritualConsistency = async (userId, dateRange) => {
  const { start, end } = getDateRange(dateRange);

  const weeklyRes = await query(
    `SELECT (log_date::DATE - EXTRACT(DOW FROM log_date::TIMESTAMPTZ)::int)::TEXT AS week_start,
            type,
            SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END)::int AS completed,
            COUNT(*)::int AS total
     FROM spiritual_logs
     WHERE user_id = $1
       AND log_date::DATE >= $2::DATE
       AND log_date::DATE <= $3::DATE
     GROUP BY week_start, type
     ORDER BY week_start, type`,
    [userId, start, end]
  );

  const byWeek = new Map();
  weeklyRes.rows.forEach((r) => {
    const weekKey = r.week_start;
    if (!byWeek.has(weekKey)) {
      byWeek.set(weekKey, { week: weekKey });
    }
    const rate = r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
    byWeek.get(weekKey)[r.type] = rate;
  });

  return {
    weeklyData: Array.from(byWeek.values()),
  };
};

export const getWeeklyReview = async (userId) => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const start = weekStart.toISOString().split('T')[0];
  const end = today.toISOString().split('T')[0];

  const tasksRes = await query(
    `SELECT title, status
     FROM tasks
     WHERE user_id = $1
       AND due_date::DATE >= $2::DATE
       AND due_date::DATE <= $3::DATE
     ORDER BY due_date`,
    [userId, start, end]
  );

  const goalsRes = await query(
    `SELECT title
     FROM goals
     WHERE user_id = $1
       AND status = 'completed'
       AND TO_CHAR(created_at::TIMESTAMPTZ, 'YYYY-MM') = $2`,
    [userId, start.slice(0, 7)]
  );

  const missedRes = await query(
    `SELECT title
     FROM tasks
     WHERE user_id = $1
       AND status IN ('todo', 'in_progress')
       AND due_date::DATE < CURRENT_DATE`,
    [userId]
  );

  const streaksRes = await query(
    `SELECT type, current_count, longest_count
     FROM streaks
     WHERE user_id = $1`,
    [userId]
  );

  const completedTasks = tasksRes.rows.filter((t) => t.status === 'done');
  const inProgressTasks = tasksRes.rows.filter((t) => t.status === 'in_progress');

  return {
    weekStart: start,
    weekEnd: end,
    completedTasks: completedTasks.map((t) => t.title),
    inProgressTasks: inProgressTasks.map((t) => t.title),
    completedGoals: goalsRes.rows.map((g) => g.title),
    missedTasks: missedRes.rows.map((t) => t.title),
    streaks: streaksRes.rows,
  };
};

export const getAnalyticsSummary = async (userId, dateRange = 'month') => {
  const [productivity, goals, study, spiritual, review] = await Promise.all([
    getProductivityOverview(userId, dateRange),
    getGoalProgress(userId, dateRange),
    getStudyAnalytics(userId, dateRange),
    getSpiritualConsistency(userId, dateRange),
    getWeeklyReview(userId),
  ]);

  return {
    productivity,
    goals,
    study,
    spiritual,
    review,
    dateRange,
  };
};
