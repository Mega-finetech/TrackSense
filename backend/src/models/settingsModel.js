import { query } from '../utils/db.js';

// Get user profile
export const getUserProfile = async (userId) => {
  const result = await query(
    `SELECT id, name, email, avatar_url FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

// Update user profile
export const updateUserProfile = async (userId, { name, email, avatar_url }) => {
  const updates = [];
  const values = [userId];
  let paramCount = 2;

  if (name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }
  if (email !== undefined) {
    updates.push(`email = $${paramCount++}`);
    values.push(email);
  }
  if (avatar_url !== undefined) {
    updates.push(`avatar_url = $${paramCount++}`);
    values.push(avatar_url);
  }

  if (updates.length === 0) {
    return getUserProfile(userId);
  }

  const result = await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING id, name, email, avatar_url`,
    values
  );
  return result.rows[0];
};

// Get user settings
export const getUserSettings = async (userId) => {
  const result = await query(
    `SELECT dark_mode, compact_view, default_landing_page
     FROM user_settings
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    // Create default settings if they don't exist
    const insertResult = await query(
      `INSERT INTO user_settings (user_id, dark_mode, compact_view, default_landing_page)
       VALUES ($1, FALSE, FALSE, 'dashboard')
       RETURNING dark_mode, compact_view, default_landing_page`,
      [userId]
    );
    return insertResult.rows[0];
  }

  return result.rows[0];
};

// Update user settings
export const updateUserSettings = async (userId, { dark_mode, compact_view, default_landing_page }) => {
  const updates = [];
  const values = [userId];
  let paramCount = 2;

  if (dark_mode !== undefined) {
    updates.push(`dark_mode = $${paramCount++}`);
    values.push(dark_mode);
  }
  if (compact_view !== undefined) {
    updates.push(`compact_view = $${paramCount++}`);
    values.push(compact_view);
  }
  if (default_landing_page !== undefined) {
    updates.push(`default_landing_page = $${paramCount++}`);
    values.push(default_landing_page);
  }

  if (updates.length === 0) {
    return getUserSettings(userId);
  }

  updates.push(`updated_at = NOW()`);
  const result = await query(
    `UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = $1
     RETURNING dark_mode, compact_view, default_landing_page`,
    values
  );

  if (result.rows.length === 0) {
    return getUserSettings(userId);
  }

  return result.rows[0];
};

// Get notification preferences
export const getNotificationPreferences = async (userId) => {
  const result = await query(
    `SELECT task_due, exam_soon, streak_risk, goal_deadline, assignment_overdue
     FROM notification_preferences
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    // Create default preferences if they don't exist
    const insertResult = await query(
      `INSERT INTO notification_preferences (user_id, task_due, exam_soon, streak_risk, goal_deadline, assignment_overdue)
       VALUES ($1, TRUE, TRUE, TRUE, TRUE, TRUE)
       RETURNING task_due, exam_soon, streak_risk, goal_deadline, assignment_overdue`,
      [userId]
    );
    return insertResult.rows[0];
  }

  return result.rows[0];
};

// Update notification preferences
export const updateNotificationPreferences = async (userId, preferences) => {
  const updates = [];
  const values = [userId];
  let paramCount = 2;

  const preferenceKeys = ['task_due', 'exam_soon', 'streak_risk', 'goal_deadline', 'assignment_overdue'];
  for (const key of preferenceKeys) {
    if (preferences[key] !== undefined) {
      updates.push(`${key} = $${paramCount++}`);
      values.push(preferences[key]);
    }
  }

  if (updates.length === 0) {
    return getNotificationPreferences(userId);
  }

  updates.push(`updated_at = NOW()`);
  const result = await query(
    `UPDATE notification_preferences SET ${updates.join(', ')} WHERE user_id = $1
     RETURNING task_due, exam_soon, streak_risk, goal_deadline, assignment_overdue`,
    values
  );

  if (result.rows.length === 0) {
    return getNotificationPreferences(userId);
  }

  return result.rows[0];
};

// Export all user data as JSON
export const exportUserData = async (userId) => {
  // Get user profile
  const userRes = await query(
    `SELECT id, name, email, created_at FROM users WHERE id = $1`,
    [userId]
  );
  const user = userRes.rows[0];

  // Get goals
  const goalsRes = await query(
    `SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  // Get tasks
  const tasksRes = await query(
    `SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  // Get projects
  const projectsRes = await query(
    `SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  // Get study sessions
  const studyRes = await query(
    `SELECT * FROM study_sessions WHERE user_id = $1 ORDER BY session_date DESC`,
    [userId]
  );

  // Get focus sessions
  const focusRes = await query(
    `SELECT * FROM focus_sessions WHERE user_id = $1 ORDER BY completed_at DESC`,
    [userId]
  );

  // Get spiritual logs
  const spiritualRes = await query(
    `SELECT * FROM spiritual_logs WHERE user_id = $1 ORDER BY log_date DESC`,
    [userId]
  );

  // Get journal entries
  const journalRes = await query(
    `SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY entry_date DESC`,
    [userId]
  );

  // Get assignments
  const assignmentsRes = await query(
    `SELECT * FROM assignments WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  // Get exams
  const examsRes = await query(
    `SELECT * FROM exams WHERE user_id = $1 ORDER BY exam_date DESC`,
    [userId]
  );

  // Get streaks
  const streaksRes = await query(
    `SELECT * FROM streaks WHERE user_id = $1`,
    [userId]
  );

  return {
    exportedAt: new Date().toISOString(),
    user,
    goals: goalsRes.rows,
    tasks: tasksRes.rows,
    projects: projectsRes.rows,
    studySessions: studyRes.rows,
    focusSessions: focusRes.rows,
    spiritualLogs: spiritualRes.rows,
    journalEntries: journalRes.rows,
    assignments: assignmentsRes.rows,
    exams: examsRes.rows,
    streaks: streaksRes.rows,
  };
};

// Delete user account and all associated data
export const deleteUserAccount = async (userId) => {
  // Delete is cascaded by FK constraints in the database
  const result = await query(`DELETE FROM users WHERE id = $1`, [userId]);
  return { deletedUser: result.rowCount === 1 };
};
