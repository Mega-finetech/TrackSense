import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as streaksCtrl from '../controllers/streaksController.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', streaksCtrl.listStreaks);
router.get('/:type', streaksCtrl.getStreakByType);
router.post('/update', streaksCtrl.updateStreak);

export default router;
