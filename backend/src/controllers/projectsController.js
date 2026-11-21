import * as projectsModel from '../models/projectsModel.js';
import * as tasksModel from '../models/tasksModel.js';
import * as projectMilestonesModel from '../models/projectMilestonesModel.js';

const attachStats = async (project) => {
  const taskCount = await projectsModel.countProjectTasks(project.id);
  const completedTaskCount = await projectsModel.countCompletedProjectTasks(project.id);
  const milestoneCount = await projectMilestonesModel.countMilestonesByProject(project.id);
  const progress = taskCount === 0 ? 0 : Math.round((completedTaskCount / taskCount) * 100);
  return { ...project, taskCount, completedTaskCount, milestoneCount, progress };
};

export const listProjects = async (req, res) => {
  const userId = req.user.id;
  const projects = await projectsModel.getProjectsByUser(userId);
  const enhancedProjects = await Promise.all(projects.map(attachStats));
  res.json(enhancedProjects);
};

export const getProject = async (req, res) => {
  const { id } = req.params;
  const project = await projectsModel.getProjectById(id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const enhanced = await attachStats(project);
  res.json(enhanced);
};

export const createProject = async (req, res) => {
  const userId = req.user.id;
  const { title, description, status, deadline, notes } = req.body;
  const project = await projectsModel.createProject(
    userId,
    title,
    description,
    status || 'planning',
    deadline || null,
    notes || null
  );
  res.status(201).json(project);
};

export const updateProject = async (req, res) => {
  const { id } = req.params;
  const project = await projectsModel.getProjectById(id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const updated = await projectsModel.updateProject(id, req.body, req.user.id);
  res.json(updated);
};

export const deleteProject = async (req, res) => {
  const { id } = req.params;
  const project = await projectsModel.getProjectById(id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  await projectsModel.deleteProject(id, req.user.id);
  res.json({ success: true });
};

export const getProjectTasks = async (req, res) => {
  const { id } = req.params;
  const tasks = await tasksModel.getTasksByProject(req.user.id, id);
  res.json(tasks);
};

export const getProjectMilestones = async (req, res) => {
  const { id } = req.params;
  const project = await projectsModel.getProjectById(id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const milestones = await projectMilestonesModel.getMilestonesByProject(id);
  res.json(milestones);
};

export const addProjectMilestone = async (req, res) => {
  const { id } = req.params;
  const project = await projectsModel.getProjectById(id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { title, due_date } = req.body;
  const milestone = await projectMilestonesModel.createMilestone(id, title, due_date || null);
  res.status(201).json(milestone);
};

export const toggleProjectMilestone = async (req, res) => {
  const { id } = req.params;
  const milestone = await projectMilestonesModel.getMilestoneById(id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

  const project = await projectsModel.getProjectById(milestone.project_id);
  if (!project || project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const updated = await projectMilestonesModel.toggleMilestone(id, !milestone.completed);
  res.json(updated);
};
