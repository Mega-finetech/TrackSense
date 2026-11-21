import { createResourceAccess } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as goalsCtrl from '../controllers/goalsController.js';

const router = express.Router();
router.use(authMiddleware);
router.use(createResourceAccess('milestones', query));

router.patch('/:id/toggle', goalsCtrl.toggleMilestoneCompletion);

export default router;
