import { safeErrorCode } from '../utils/safeError.js';
import * as analyticsModel from '../models/analyticsModel.js';

export const getAnalyticsSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dateRange } = req.query;

    const analytics = await analyticsModel.getAnalyticsSummary(userId, dateRange || 'month');
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', safeErrorCode(error));
    res.status(500).json({ error: 'Failed to load analytics' });
  }
};

export const getProductivityOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dateRange } = req.query;

    const data = await analyticsModel.getProductivityOverview(userId, dateRange);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load productivity overview' });
  }
};

export const getGoalProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dateRange } = req.query;

    const data = await analyticsModel.getGoalProgress(userId, dateRange);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load goal progress' });
  }
};

export const getStudyAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dateRange } = req.query;

    const data = await analyticsModel.getStudyAnalytics(userId, dateRange);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load study analytics' });
  }
};

export const getSpiritualConsistency = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dateRange } = req.query;

    const data = await analyticsModel.getSpiritualConsistency(userId, dateRange);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load spiritual consistency data' });
  }
};

export const getWeeklyReview = async (req, res) => {
  try {
    const userId = req.user.id;

    const data = await analyticsModel.getWeeklyReview(userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load weekly review' });
  }
};
