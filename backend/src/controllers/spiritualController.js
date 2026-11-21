import * as spiritualLogsModel from '../models/spiritualLogsModel.js';
import * as streaksModel from '../models/streaksModel.js';

const getDateRange = (start, end) => {
  const today = new Date();
  const endDate = end ? new Date(end) : today;
  const startDate = start ? new Date(start) : new Date(endDate.getTime() - 29 * 24 * 60 * 60 * 1000);
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};

export const listPrayerLogs = async (req, res) => {
  const userId = req.user.id;
  const { start, end } = req.query;
  const range = getDateRange(start, end);
  const logs = await spiritualLogsModel.getSpiritualLogs(userId, 'prayer', range.startDate, range.endDate);
  res.json(logs);
};

export const savePrayerLog = async (req, res) => {
  const userId = req.user.id;
  const { log_date, details } = req.body;
  const log = await spiritualLogsModel.upsertSpiritualLog(userId, 'prayer', log_date, null, details);

  const today = new Date().toISOString().split('T')[0];
  if (log_date === today && Object.values(details || {}).some(Boolean)) {
    await streaksModel.updateStreak(userId, 'prayer');
  }

  res.status(201).json(log);
};

export const listDevotionLogs = async (req, res) => {
  const userId = req.user.id;
  const { start, end } = req.query;
  const range = getDateRange(start, end);
  const logs = await spiritualLogsModel.getSpiritualLogs(userId, 'devotion', range.startDate, range.endDate);
  res.json(logs);
};

export const saveDevotionLog = async (req, res) => {
  const userId = req.user.id;
  const { log_date, notes } = req.body;
  const log = await spiritualLogsModel.upsertSpiritualLog(userId, 'devotion', log_date, notes, null);

  const today = new Date().toISOString().split('T')[0];
  if (log_date === today) {
    await streaksModel.updateStreak(userId, 'devotion');
  }

  res.status(201).json(log);
};
