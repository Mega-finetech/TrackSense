import * as biblePlansModel from '../models/biblePlansModel.js';
import * as streaksModel from '../models/streaksModel.js';

export const listBiblePlans = async (req, res) => {
  const userId = req.user.id;
  const plans = await biblePlansModel.getBiblePlansByUser(userId);
  res.json(plans);
};

export const createBiblePlan = async (req, res) => {
  const userId = req.user.id;
  const { title, total_chapters, chapters_per_day, start_date } = req.body;
  const plan = await biblePlansModel.createBiblePlan(userId, title, total_chapters, chapters_per_day, start_date);
  res.status(201).json(plan);
};

export const updateBiblePlan = async (req, res) => {
  const { id } = req.params;
  const plan = await biblePlansModel.updateBiblePlan(id, req.body, req.user.id);
  res.json(plan);
};

export const deleteBiblePlan = async (req, res) => {
  const { id } = req.params;
  await biblePlansModel.deleteBiblePlan(id, req.user.id);
  res.json({ success: true });
};

export const listPlanEntries = async (req, res) => {
  const { id } = req.params;
  const entries = await biblePlansModel.getPlanEntries(id);
  res.json(entries);
};

export const upsertPlanEntry = async (req, res) => {
  const { id } = req.params;
  const { day_date, completed, notes } = req.body;
  const entry = await biblePlansModel.upsertPlanEntry(id, day_date, completed, notes);

  const today = new Date().toISOString().split('T')[0];
  if (day_date === today && completed) {
    await streaksModel.updateStreak(req.user.id, 'bible');
  }

  res.status(201).json(entry);
};
