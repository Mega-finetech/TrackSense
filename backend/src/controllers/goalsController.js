import * as goalsModel from '../models/goalsModel.js';
import * as milestonesModel from '../models/milestonesModel.js';

export const getGoal = async (req, res) => {
  const goal = await goalsModel.getGoalById(req.params.id);
  if (!goal || goal.user_id !== req.user.id) return res.status(404).json({ error: 'Goal not found' });
  res.json(goal);
};

export const getGoalMilestones = async (req, res) => {
  const goal = await goalsModel.getGoalById(req.params.id);
  if (!goal || goal.user_id !== req.user.id) return res.status(404).json({ error: 'Goal not found' });
  res.json(await milestonesModel.getMilestonesByGoal(goal.id));
};

const calcAndSetProgress = async (goalId) => {
  const total = await milestonesModel.countMilestones(goalId);
  const completed = await milestonesModel.countCompletedMilestones(goalId);
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  await goalsModel.setGoalProgress(goalId, progress);
  return progress;
};

export const listGoals = async (req, res) => {
  const userId = req.user.id;
  const goals = await goalsModel.getGoalsByUser(userId);
  // attach counts and progress from milestones
  const enhanced = await Promise.all(goals.map(async (g) => {
    const total = await milestonesModel.countMilestones(g.id);
    const completed = await milestonesModel.countCompletedMilestones(g.id);
    return { ...g, milestoneCount: total, completedMilestones: completed };
  }));
  res.json(enhanced);
};

export const createGoal = async (req, res) => {
  const userId = req.user.id;
  const { title, description, category, status, deadline } = req.body;
  const goal = await goalsModel.createGoal(userId, title, description, category, status || 'active', deadline || null);
  // initial progress is 0
  res.status(201).json(goal);
};

export const updateGoal = async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const goal = await goalsModel.updateGoal(id, fields, req.user.id);
  // recalc progress if needed
  await calcAndSetProgress(id);
  res.json(goal);
};

export const deleteGoal = async (req, res) => {
  const { id } = req.params;
  await goalsModel.deleteGoal(id, req.user.id);
  res.json({ success: true });
};

export const addMilestone = async (req, res) => {
  const { id: goalId } = req.params;
  const { title, due_date } = req.body;
  const m = await milestonesModel.createMilestone(goalId, title, due_date || null);
  const progress = await calcAndSetProgress(goalId);
  res.status(201).json({ milestone: m, progress });
};

export const toggleMilestoneCompletion = async (req, res) => {
  const { id } = req.params; // milestone id
  const milestone = await milestonesModel.getMilestoneById(id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
  const toggled = await milestonesModel.toggleMilestone(id, !milestone.completed);
  const progress = await calcAndSetProgress(toggled.goal_id);
  res.json({ milestone: toggled, progress });
};
