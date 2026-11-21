import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as focusSessionsCtrl from '../controllers/focusSessionsController.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', focusSessionsCtrl.listFocusSessions);
router.post('/', focusSessionsCtrl.createFocusSession);
router.get('/today-stats', focusSessionsCtrl.getTodayStats);
router.get('/analytics', focusSessionsCtrl.getAnalytics);

export default router;
