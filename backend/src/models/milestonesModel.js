import { query } from '../utils/db.js';

export const getMilestonesByGoal = async (goalId) => {
  const res = await query(
    'SELECT * FROM milestones WHERE goal_id = $1 ORDER BY id',
    [goalId]
  );
  return res.rows;
};

export const createMilestone = async (goalId, title, due_date) => {
  const res = await query(
    `INSERT INTO milestones (goal_id, title, due_date) VALUES ($1,$2,$3) RETURNING *`,
    [goalId, title, due_date]
  );
  return res.rows[0];
};

export const getMilestoneById = async (id) => {
  const res = await query('SELECT * FROM milestones WHERE id = $1', [id]);
  return res.rows[0];
};

export const toggleMilestone = async (id, completed) => {
  const res = await query(
    `UPDATE milestones SET completed = $1 WHERE id = $2 RETURNING *`,
    [completed ? '1' : '0', id]
  );
  return res.rows[0];
};

export const countMilestones = async (goalId) => {
  const res = await query(
    'SELECT COUNT(*)::int AS total FROM milestones WHERE goal_id = $1',
    [goalId]
  );
  return res.rows[0].total;
};

export const countCompletedMilestones = async (goalId) => {
  const res = await query(
    "SELECT COUNT(*)::int AS completed FROM milestones WHERE goal_id = $1 AND completed::text IN ('1', 'true', 't')",
    [goalId]
  );
  return res.rows[0].completed;
};
