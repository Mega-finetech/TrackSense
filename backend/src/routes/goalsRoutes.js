import { createResourceAccess } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';
import express from 'express';
import * as goalsCtrl from '../controllers/goalsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require auth
router.use(authMiddleware);
router.use(createResourceAccess('goals', query));

router.get('/', goalsCtrl.listGoals);
router.get('/:id', goalsCtrl.getGoal);
router.get('/:id/milestones', goalsCtrl.getGoalMilestones);
router.post('/', goalsCtrl.createGoal);
router.put('/:id', goalsCtrl.updateGoal);
router.delete('/:id', goalsCtrl.deleteGoal);

// milestones
router.post('/:id/milestones', goalsCtrl.addMilestone);
router.patch('/milestones/:id/toggle', goalsCtrl.toggleMilestoneCompletion);

export default router;
