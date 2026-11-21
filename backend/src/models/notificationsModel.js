import { query } from '../utils/db.js';

export const getNotifications = async (userId, limit = 20) => {
  const result = await query(
    `SELECT id, type, title, message, related_id, is_read, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

export const getUnreadCount = async (userId) => {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM notifications
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return result.rows[0]?.count || 0;
};

export const markAsRead = async (notificationId) => {
  const result = await query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1
     RETURNING *`,
    [notificationId]
  );
  return result.rows[0];
};

export const markAllAsRead = async (userId) => {
  const result = await query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE
     RETURNING id`,
    [userId]
  );
  return { updatedCount: result.rowCount };
};

export const clearAllNotifications = async (userId) => {
  const result = await query(
    `DELETE FROM notifications
     WHERE user_id = $1`,
    [userId]
  );
  return { deletedCount: result.rowCount };
};

const createNotification = async (userId, type, title, message, relatedId = null) => {
  const preferences = (await query('SELECT * FROM notification_preferences WHERE user_id=$1',[userId])).rows[0];
  if (preferences?.[type] === false) return null;
  const result = await query(
    `INSERT INTO notifications (user_id, type, title, message, related_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, type, title, message, relatedId]
  );
  return result.rows[0];
};

export const generateNotifications = async (userId) => {
  const notifications = [];
  const today = new Date().toISOString().split('T')[0];

  const tasksRes = await query(
    `SELECT id, title FROM tasks
     WHERE user_id = $1
       AND status != 'done'
       AND due_date::DATE = $2::DATE`,
    [userId, today]
  );

  for (const task of tasksRes.rows) {
    const existingRes = await query(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND related_id = $2 AND type = 'task_due'
         AND created_at::DATE = $3::DATE`,
      [userId, task.id, today]
    );

    if (existingRes.rows.length === 0) {
      const notif = await createNotification(
        userId,
        'task_due',
        `Task due today: ${task.title}`,
        `Your task "${task.title}" is due today.`,
        task.id
      );
      notifications.push(notif);
    }
  }

  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const threeDaysFromNowStr = threeDaysFromNow.toISOString().split('T')[0];
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  const twoDaysFromNowStr = twoDaysFromNow.toISOString().split('T')[0];

  const examsRes = await query(
    `SELECT id, subject, exam_date FROM exams
     WHERE user_id = $1
       AND exam_date::DATE >= $2::DATE
       AND exam_date::DATE <= $3::DATE`,
    [userId, twoDaysFromNowStr, threeDaysFromNowStr]
  );

  for (const exam of examsRes.rows) {
    const existingRes = await query(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND related_id = $2 AND type = 'exam_soon'
         AND created_at::DATE = $3::DATE`,
      [userId, exam.id, today]
    );

    if (existingRes.rows.length === 0) {
      const notif = await createNotification(
        userId,
        'exam_soon',
        `Exam in 3 days: ${exam.subject}`,
        `Your ${exam.subject} exam is in 3 days. Start preparing!`,
        exam.id
      );
      notifications.push(notif);
    }
  }

  const streaksRes = await query(
    `SELECT type, current_count FROM streaks
     WHERE user_id = $1`,
    [userId]
  );

  for (const streak of streaksRes.rows) {
    const hasSessionRes = await query(
      `SELECT id FROM focus_sessions
       WHERE user_id = $1 AND type = $2 AND completed_at::DATE = $3::DATE`,
      [userId, streak.type === 'focus' ? 'pomodoro' : streak.type, today]
    );

    if (hasSessionRes.rows.length === 0) {
      const existingRes = await query(
        `SELECT id FROM notifications
         WHERE user_id = $1 AND type = 'streak_risk'
           AND message LIKE $2
           AND created_at::DATE = $3::DATE`,
        [userId, `%${streak.type}%`, today]
      );

      if (existingRes.rows.length === 0 && streak.current_count > 0) {
        const notif = await createNotification(
          userId,
          'streak_risk',
          `${streak.type} streak at risk (${streak.current_count} days)`,
          `Complete a session today to keep your ${streak.current_count}-day ${streak.type} streak alive!`
        );
        notifications.push(notif);
      }
    }
  }

  const threeDaysFromNowDt = new Date();
  threeDaysFromNowDt.setDate(threeDaysFromNowDt.getDate() + 3);
  const threeDaysStr = threeDaysFromNowDt.toISOString().split('T')[0];

  const goalsRes = await query(
    `SELECT id, title, deadline FROM goals
     WHERE user_id = $1
       AND status = 'active'
       AND deadline::DATE >= $2::DATE
       AND deadline::DATE <= $3::DATE`,
    [userId, twoDaysFromNowStr, threeDaysStr]
  );

  for (const goal of goalsRes.rows) {
    const existingRes = await query(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND related_id = $2 AND type = 'goal_deadline'
         AND created_at::DATE = $3::DATE`,
      [userId, goal.id, today]
    );

    if (existingRes.rows.length === 0) {
      const notif = await createNotification(
        userId,
        'goal_deadline',
        `Goal deadline in 3 days: ${goal.title}`,
        `Your goal "${goal.title}" deadline is approaching in 3 days.`,
        goal.id
      );
      notifications.push(notif);
    }
  }

  const assignmentsRes = await query(
    `SELECT id, title FROM assignments
     WHERE user_id = $1
       AND status IN ('pending', 'submitted')
       AND due_date::TIMESTAMPTZ < NOW()`,
    [userId]
  );

  for (const assignment of assignmentsRes.rows) {
    const existingRes = await query(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND related_id = $2 AND type = 'assignment_overdue'
         AND created_at::DATE = $3::DATE`,
      [userId, assignment.id, today]
    );

    if (existingRes.rows.length === 0) {
      const notif = await createNotification(
        userId,
        'assignment_overdue',
        `Assignment overdue: ${assignment.title}`,
        `Your assignment "${assignment.title}" is overdue. Please submit it as soon as possible.`,
        assignment.id
      );
      notifications.push(notif);
    }
  }

  return notifications.filter(Boolean);
};

export const checkAllUsersNotifications = async () => {
  const usersRes = await query('SELECT id FROM users');
  let totalGenerated = 0;

  for (const user of usersRes.rows) {
    const notifs = await generateNotifications(user.id);
    totalGenerated += notifs.length;
  }

  return { checkedUsers: usersRes.rows.length, notificationsGenerated: totalGenerated };
};
