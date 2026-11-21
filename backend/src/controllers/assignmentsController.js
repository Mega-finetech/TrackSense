import * as assignmentsModel from '../models/assignmentsModel.js';

export const listAssignments = async (req, res) => {
  const userId = req.user.id;
  const assignments = await assignmentsModel.getAssignmentsByUser(userId);
  res.json(assignments);
};

export const createAssignment = async (req, res) => {
  const userId = req.user.id;
  const { course_id, title, due_date, weight, status, earned_score, total_score } = req.body;
  const assignment = await assignmentsModel.createAssignment(userId, course_id, title, due_date, weight, status, earned_score, total_score);
  res.status(201).json(assignment);
};

export const updateAssignment = async (req, res) => {
  const { id } = req.params;
  const assignment = await assignmentsModel.updateAssignment(id, req.body, req.user.id);
  res.json(assignment);
};

export const deleteAssignment = async (req, res) => {
  const { id } = req.params;
  await assignmentsModel.deleteAssignment(id, req.user.id);
  res.json({ success: true });
};

export const getAssignmentsByCourse = async (req, res) => {
  const { courseId } = req.params;
  const assignments = await assignmentsModel.getAssignmentsByCourse(courseId, req.user.id);
  res.json(assignments);
};
