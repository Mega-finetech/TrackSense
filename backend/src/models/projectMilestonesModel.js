import { query } from '../utils/db.js';

export const getMilestonesByProject = async (projectId) => {
  const res = await query(
    'SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY created_at',
    [projectId]
  );
  return res.rows;
};

export const countMilestonesByProject = async (projectId) => {
  const res = await query(
    'SELECT COUNT(*)::int AS total FROM project_milestones WHERE project_id = $1',
    [projectId]
  );
  return res.rows[0].total;
};

export const createMilestone = async (projectId, title, due_date) => {
  const res = await query(
    `INSERT INTO project_milestones (project_id, title, due_date)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [projectId, title, due_date || null]
  );
  return res.rows[0];
};

export const getMilestoneById = async (id) => {
  const res = await query('SELECT * FROM project_milestones WHERE id = $1', [id]);
  return res.rows[0];
};

export const toggleMilestone = async (id, completed) => {
  const res = await query(
    'UPDATE project_milestones SET completed = $1 WHERE id = $2 RETURNING *',
    [completed ? '1' : '0', id]
  );
  return res.rows[0];
};
