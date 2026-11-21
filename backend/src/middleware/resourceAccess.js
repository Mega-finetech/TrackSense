// Only these server-defined table/column names may be interpolated into SQL.
const resources = {
  tasks: { table: 'tasks', fields: ['title', 'description', 'priority', 'status', 'due_date', 'goal_id', 'project_id', 'is_recurring', 'recur_pattern'] },
  goals: { table: 'goals', fields: ['title', 'description', 'category', 'status', 'deadline'] },
  projects: { table: 'projects', fields: ['title', 'description', 'status', 'deadline', 'notes'] },
  courses: { table: 'courses', fields: ['name', 'code', 'credits', 'status', 'topics', 'modules'] },
  assignments: { table: 'assignments', fields: ['course_id', 'title', 'due_date', 'weight', 'grade', 'status', 'earned_score', 'total_score'] },
  exams: { table: 'exams', fields: ['course_id', 'subject', 'exam_date', 'location'] },
  'study-sessions': { table: 'study_sessions', fields: ['subject', 'duration_minutes', 'session_date', 'notes'] },
  'bible-plans': { table: 'bible_study_plans', fields: ['title', 'total_chapters', 'chapters_per_day', 'start_date', 'status'] },
  milestones: { table: 'milestones', fields: [] },
  notifications: { table: 'notifications', fields: [] },
};
const foreignKeys = { goal_id: 'goals', project_id: 'projects', course_id: 'courses' };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const failure = (status, message) => Object.assign(new Error(message), { status });

export function validateFields(body, allowed) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw failure(400, 'Expected an object');
  const keys = Object.keys(body);
  if (!keys.length || keys.some(key => !allowed.includes(key))) throw failure(400, 'Invalid request fields');
  for (const key of ['title', 'name', 'subject']) {
    if (key in body && (typeof body[key] !== 'string' || !body[key].trim() || body[key].length > 500)) {
      throw failure(400, `Invalid ${key}`);
    }
  }
}

const validScore = value => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0);

function validateChecklist(items, completedKey) {
  if (!Array.isArray(items) || items.length > 200) throw failure(400, 'Expected a checklist array');
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw failure(400, 'Invalid checklist item');
    if (typeof item.id !== 'string' || !item.id.trim() || item.id.length > 100) throw failure(400, 'Invalid checklist item ID');
    if (typeof item.title !== 'string' || !item.title.trim() || item.title.length > 500) throw failure(400, 'Invalid checklist item title');
    if (typeof item[completedKey] !== 'boolean') throw failure(400, 'Invalid checklist item state');
  }
}

// Dependency injection keeps authorization tests independent of any real database.
export function createResourceAccess(resource, query) {
  const config = resources[resource];
  if (!config) throw new Error('Unknown resource');
  return async (req, res, next) => {
    try {
      if (!req.user?.id) throw failure(401, 'Authentication required');
      const owned = async (table, id) => {
        if (typeof id !== 'string' || !uuid.test(id)) throw failure(400, 'Invalid record ID');
        let sql;
        if (table === 'milestones') {
          sql = 'SELECT m.id FROM milestones m JOIN goals g ON g.id = m.goal_id WHERE m.id = $1 AND g.user_id = $2';
        } else if (table === 'project_milestones') {
          sql = 'SELECT m.id FROM project_milestones m JOIN projects p ON p.id = m.project_id WHERE m.id = $1 AND p.user_id = $2';
        } else {
          sql = `SELECT id FROM ${table} WHERE id = $1 AND user_id = $2`;
        }
        const result = await query(sql, [id, req.user.id]);
        if (!result.rows.length) throw failure(404, 'Record not found');
      };
      const parts = req.path.split('/').filter(Boolean);
      const reserved = resource === 'notifications' ? ['unread-count', 'check', 'clear-all', 'read-all'] : resource === 'study-sessions' ? ['weekly-hours'] : [];
      if (parts[0] === 'cron') throw failure(403, 'This operation is not available to user sessions');
      if (parts[0] === 'milestones' && ['goals', 'projects'].includes(resource)) {
        await owned(resource === 'goals' ? 'milestones' : 'project_milestones', parts[1]);
      } else if (['course', 'project', 'goal'].includes(parts[0])) {
        await owned({ course: 'courses', project: 'projects', goal: 'goals' }[parts[0]], parts[1]);
      } else if (parts.length && !reserved.includes(parts[0])) {
        await owned(config.table, parts[0]);
      }
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        if (req.method === 'POST' && parts[1] === 'milestones' && ['goals', 'projects'].includes(resource)) {
          validateFields(req.body, ['title', 'due_date']);
          if (!req.body.title?.trim()) throw failure(400, 'Milestone title is required');
          if (req.body.due_date != null && (typeof req.body.due_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(req.body.due_date) || !Number.isFinite(Date.parse(req.body.due_date)))) throw failure(400, 'Invalid milestone date');
        }
        if (!reserved.includes(parts[0]) && (parts.length === 0 || (parts.length === 1 && req.method === 'PUT'))) {
          validateFields(req.body, config.fields);
          if (['goals', 'projects'].includes(resource)) {
            const { title, status, deadline, category, description, notes } = req.body;
            if (req.method === 'POST' && !title?.trim()) throw failure(400, 'Title is required');
            const statuses = resource === 'goals' ? ['active', 'completed', 'paused', 'overdue'] : ['planning', 'active', 'on_hold', 'completed'];
            if (status !== undefined && !statuses.includes(status)) throw failure(400, 'Invalid status');
            if (deadline != null && (typeof deadline !== 'string' || !Number.isFinite(Date.parse(deadline)))) throw failure(400, 'Invalid deadline');
            if (resource === 'goals' && (req.method === 'POST' || category !== undefined) && (typeof category !== 'string' || !category.trim() || category.length > 100)) throw failure(400, 'Category is required');
            for (const text of [description, notes]) if (text != null && (typeof text !== 'string' || text.length > 4000)) throw failure(400, 'Invalid description or notes');
          }
          if (resource === 'tasks') {
            const { title, priority, status, due_date, is_recurring, recur_pattern } = req.body;
            if (req.method === 'POST' && !title?.trim()) throw failure(400, 'Task title is required');
            if (priority !== undefined && !['low', 'medium', 'high', 'urgent'].includes(priority)) throw failure(400, 'Invalid priority');
            if (status !== undefined && !['todo', 'in_progress', 'done', 'archived'].includes(status)) throw failure(400, 'Invalid status');
            if (due_date !== undefined && due_date !== null && (typeof due_date !== 'string' || !Number.isFinite(Date.parse(due_date)))) throw failure(400, 'Invalid due date');
            if (is_recurring !== undefined && typeof is_recurring !== 'boolean') throw failure(400, 'Invalid recurring flag');
            if (recur_pattern !== undefined && recur_pattern !== null && (typeof recur_pattern !== 'object' || Array.isArray(recur_pattern))) throw failure(400, 'Invalid recurring pattern');
          }
          if (resource === 'courses') {
            if (req.body.topics !== undefined) validateChecklist(req.body.topics, 'completed');
            if (req.body.modules !== undefined) validateChecklist(req.body.modules, 'isCompleted');
          }
          if (resource === 'assignments') {
            const { earned_score, total_score } = req.body;
            if (earned_score !== undefined && !validScore(earned_score)) throw failure(400, 'Invalid earned score');
            if (total_score !== undefined && (total_score === null || !validScore(total_score) || total_score <= 0)) throw failure(400, 'Invalid total score');
            if (earned_score != null && total_score != null && earned_score > total_score) throw failure(400, 'Earned score cannot exceed total score');
          }
        }
        for (const [key, table] of Object.entries(foreignKeys)) {
          if (req.body?.[key] != null) await owned(table, req.body[key]);
        }
      }
      next();
    } catch (error) { next(error); }
  };
}
