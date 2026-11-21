import * as studySessionsModel from '../models/studySessionsModel.js';

export const listStudySessions = async (req, res) => {
  const userId = req.user.id;
  const sessions = await studySessionsModel.getStudySessionsByUser(userId);
  res.json(sessions);
};

export const createStudySession = async (req, res) => {
  const userId = req.user.id;
  const { subject, duration_minutes, session_date, notes } = req.body;
  const session = await studySessionsModel.createStudySession(userId, subject, duration_minutes, session_date, notes);
  res.status(201).json(session);
};

export const updateStudySession = async (req, res) => {
  const { id } = req.params;
  const session = await studySessionsModel.updateStudySession(id, req.body, req.user.id);
  res.json(session);
};

export const deleteStudySession = async (req, res) => {
  const { id } = req.params;
  await studySessionsModel.deleteStudySession(id, req.user.id);
  res.json({ success: true });
};

export const getWeeklyStudyHours = async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const data = await studySessionsModel.getWeeklyStudyHours(userId, weekStart.toISOString(), weekEnd.toISOString());
  res.json(data);
};
