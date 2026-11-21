import { createResourceAccess } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as projectsCtrl from '../controllers/projectsController.js';

const router = express.Router();
router.use(authMiddleware);
router.use(createResourceAccess('projects', query));

router.get('/', projectsCtrl.listProjects);
router.get('/:id', projectsCtrl.getProject);
router.post('/', projectsCtrl.createProject);
router.put('/:id', projectsCtrl.updateProject);
router.delete('/:id', projectsCtrl.deleteProject);
router.get('/:id/tasks', projectsCtrl.getProjectTasks);
router.get('/:id/milestones', projectsCtrl.getProjectMilestones);
router.post('/:id/milestones', projectsCtrl.addProjectMilestone);
router.patch('/milestones/:id/toggle', projectsCtrl.toggleProjectMilestone);

export default router;
