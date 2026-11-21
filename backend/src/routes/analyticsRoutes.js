import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as analyticsCtrl from '../controllers/analyticsController.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', analyticsCtrl.getAnalyticsSummary);
router.get('/productivity', analyticsCtrl.getProductivityOverview);
router.get('/goals', analyticsCtrl.getGoalProgress);
router.get('/study', analyticsCtrl.getStudyAnalytics);
router.get('/spiritual', analyticsCtrl.getSpiritualConsistency);
router.get('/review', analyticsCtrl.getWeeklyReview);

export default router;
