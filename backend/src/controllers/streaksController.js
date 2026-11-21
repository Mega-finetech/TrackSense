import * as streaksModel from '../models/streaksModel.js';

const VALID_TYPES = ['prayer', 'devotion', 'bible', 'study', 'focus'];

export const listStreaks = async (req, res) => {
  const userId = req.user.id;
  const streaks = await streaksModel.getStreaksByUser(userId);
  res.json(streaks);
};

export const getStreakByType = async (req, res) => {
  const userId = req.user.id;
  const { type } = req.params;

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid streak type' });
  }

  const streak = await streaksModel.getStreakByType(userId, type);
  if (!streak) {
    return res.status(404).json({ error: 'No streak found for that type' });
  }

  res.json(streak);
};

export const updateStreak = async (req, res) => {
  const userId = req.user.id;
  const { type, date } = req.body;

  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid or missing streak type' });
  }

  const streak = await streaksModel.updateStreak(userId, type, date);
  res.status(201).json(streak);
};
