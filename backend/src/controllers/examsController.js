import * as examsModel from '../models/examsModel.js';

export const listExams = async (req, res) => {
  const userId = req.user.id;
  const exams = await examsModel.getExamsByUser(userId);
  res.json(exams);
};

export const createExam = async (req, res) => {
  const userId = req.user.id;
  const { course_id, subject, exam_date, location } = req.body;
  const exam = await examsModel.createExam(userId, course_id, subject, exam_date, location);
  res.status(201).json(exam);
};

export const updateExam = async (req, res) => {
  const { id } = req.params;
  const exam = await examsModel.updateExam(id, req.body, req.user.id);
  res.json(exam);
};

export const deleteExam = async (req, res) => {
  const { id } = req.params;
  await examsModel.deleteExam(id, req.user.id);
  res.json({ success: true });
};

export const getExamsByCourse = async (req, res) => {
  const { courseId } = req.params;
  const exams = await examsModel.getExamsByCourse(courseId, req.user.id);
  res.json(exams);
};
