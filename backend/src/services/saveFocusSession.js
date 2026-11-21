export async function saveFocusSession(query, { userId, taskId, type, duration, completedAt, sessionId }) {
  const result = await query(
    `INSERT INTO focus_sessions (user_id, task_id, type, duration, completed_at, id)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING RETURNING *`,
    [userId, taskId || null, type, duration, completedAt, sessionId],
  );
  if (result.rows[0]) return result.rows[0];
  const existing = await query('SELECT * FROM focus_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
  if (!existing.rows[0]) throw Object.assign(new Error('Session identifier already used'), { status: 409 });
  return existing.rows[0];
}
