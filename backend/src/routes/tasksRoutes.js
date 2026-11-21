import { createResourceAccess } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as tasksCtrl from '../controllers/tasksController.js';

const router = express.Router();
router.use(authMiddleware);
router.use(createResourceAccess('tasks', query));

router.get('/', tasksCtrl.listTasks);
router.post('/', tasksCtrl.createTask);
router.put('/:id', tasksCtrl.updateTask);
router.delete('/:id', tasksCtrl.deleteTask);
router.get('/project/:projectId', tasksCtrl.getTasksByProject);
router.get('/goal/:goalId', tasksCtrl.getTasksByGoal);

export default router;
