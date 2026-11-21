import * as tasksModel from '../models/tasksModel.js';

export const listTasks = async (req, res) => {
  const userId = req.user.id;
  const { status, priority, due_date_from, due_date_to, goal_id, project_id } = req.query;
  const filters = { status, priority, due_date_from, due_date_to, goal_id, project_id };
  const tasks = await tasksModel.getTasksByUser(userId, filters);
  res.json(tasks);
};

export const createTask = async (req, res) => {
  const userId = req.user.id;
  const { title, description, status, priority, due_date, goal_id, project_id, is_recurring, recur_pattern } = req.body;
  const task = await tasksModel.createTask(
    userId,
    title,
    description,
    status,
    priority,
    due_date,
    goal_id,
    project_id,
    is_recurring ?? false,
    recur_pattern ?? null
  );
  res.status(201).json(task);
};

const parseWeekdays = (days) => {
  if (!Array.isArray(days)) return [];
  const map = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return days
    .map((day) => (typeof day === 'string' ? map[day.toLowerCase()] : Number(day)))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
};

const calculateNextDueDate = (task) => {
  if (!task || !task.recur_pattern) return null;
  const pattern = typeof task.recur_pattern === 'string' ? JSON.parse(task.recur_pattern) : task.recur_pattern;
  const baseDate = task.due_date ? new Date(task.due_date) : new Date();
  baseDate.setHours(0, 0, 0, 0);
  let nextDate = null;

  if (pattern.type === 'daily') {
    nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (pattern.type === 'weekly') {
    const days = parseWeekdays(pattern.days || []);
    if (!days.length) return null;
    const currentDay = baseDate.getDay();
    const sorted = [...new Set(days)].sort((a, b) => a - b);
    const found = sorted.find((d) => d > currentDay);
    nextDate = new Date(baseDate);
    if (found !== undefined) {
      nextDate.setDate(nextDate.getDate() + ((found - currentDay + 7) % 7));
    } else {
      const nextDay = sorted[0];
      nextDate.setDate(nextDate.getDate() + ((nextDay - currentDay + 7) % 7 || 7));
    }
  } else if (pattern.type === 'monthly') {
    const dayOfMonth = Number(pattern.day) || baseDate.getDate();
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth() + 1;
    const tryDate = new Date(year, month, dayOfMonth);
    if (tryDate.getMonth() === month) {
      nextDate = tryDate;
    } else {
      const lastDay = new Date(year, month + 1, 0).getDate();
      nextDate = new Date(year, month, Math.min(dayOfMonth, lastDay));
    }
  }

  if (nextDate) {
    nextDate.setHours(9, 0, 0, 0);
    return nextDate.toISOString();
  }
  return null;
};

export const updateTask = async (req, res) => {
  const { id } = req.params;
  const existing = await tasksModel.getTaskById(id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const task = await tasksModel.updateTask(id, req.body, req.user.id);
  let nextTask = null;

  const statusChangedToDone = req.body.status === 'done' && existing.status !== 'done';
  if (statusChangedToDone && existing.is_recurring) {
    const nextDueDate = calculateNextDueDate(existing);
    if (nextDueDate) {
      nextTask = await tasksModel.createTask(
        existing.user_id,
        existing.title,
        existing.description,
        'todo',
        existing.priority,
        nextDueDate,
        existing.goal_id,
        existing.project_id,
        true,
        existing.recur_pattern
      );
    }
  }

  res.json({ task, nextTask });
};

export const deleteTask = async (req, res) => {
  const { id } = req.params;
  await tasksModel.deleteTask(id, req.user.id);
  res.json({ success: true });
};

export const getTasksByGoal = async (req, res) => {
  const { goalId } = req.params;
  const tasks = await tasksModel.getTasksByGoal(req.user.id, goalId);
  res.json(tasks);
};

export const getTasksByProject = async (req, res) => {
  const { projectId } = req.params;
  const tasks = await tasksModel.getTasksByProject(req.user.id, projectId);
  res.json(tasks);
};
