import * as coursesModel from '../models/coursesModel.js';

export const listCourses = async (req, res) => {
  const userId = req.user.id;
  const courses = await coursesModel.getCoursesByUser(userId);
  res.json(courses);
};

export const createCourse = async (req, res) => {
  const userId = req.user.id;
  const { name, code, credits, status, topics, modules } = req.body;
  const course = await coursesModel.createCourse(userId, name, code, credits, status, topics, modules);
  res.status(201).json(course);
};

export const updateCourse = async (req, res) => {
  const { id } = req.params;
  const course = await coursesModel.updateCourse(id, req.body, req.user.id);
  res.json(course);
};

export const deleteCourse = async (req, res) => {
  const { id } = req.params;
  await coursesModel.deleteCourse(id, req.user.id);
  res.json({ success: true });
};
