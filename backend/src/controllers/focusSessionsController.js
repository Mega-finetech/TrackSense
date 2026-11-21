import * as focusSessionsModel from '../models/focusSessionsModel.js';
import * as tasksModel from '../models/tasksModel.js';

export const listFocusSessions = async (req, res) => {
  const userId = req.user.id;
  const sessions = await focusSessionsModel.getFocusSessionsByUser(userId);
  res.json(sessions);
};

export const createFocusSession = async (req, res) => {
  const userId = req.user.id;
  const { task_id, type, duration, completed_at, client_session_id } = req.body;

  if (client_session_id !== undefined && (typeof client_session_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(client_session_id))) {
    return res.status(400).json({ error: 'Invalid session identifier' });
  }
  if (completed_at !== undefined && (typeof completed_at !== 'string' || !Number.isFinite(Date.parse(completed_at)))) {
    return res.status(400).json({ error: 'Invalid completion time' });
  }

  if (!type || !['pomodoro', 'deep'].includes(type)) {
    return res.status(400).json({ error: 'Invalid focus session type' });
  }
  if (!Number.isInteger(Number(duration)) || Number(duration) <= 0 || Number(duration) > 1440) {
    return res.status(400).json({ error: 'Duration must be a positive integer' });
  }

  if (task_id) {
    const task = await tasksModel.getTaskById(task_id);
    if (!task || task.user_id !== userId) {
      return res.status(403).json({ error: 'Task not found or not owned by user' });
    }
  }

  const session = await focusSessionsModel.createFocusSession(
    userId,
    task_id,
    type,
    Number(duration),
    completed_at || new Date().toISOString(),
    client_session_id
  );
  res.status(201).json(session);
};

export const getTodayStats = async (req, res) => {
  const userId = req.user.id;
  const stats = await focusSessionsModel.getTodayFocusStats(userId);
  res.json(stats);
};

export const getAnalytics = async (req, res) => {
  const userId = req.user.id;
  const analytics = await focusSessionsModel.getAnalytics(userId);
  res.json(analytics);
};
