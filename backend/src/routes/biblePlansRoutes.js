import { createResourceAccess } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as biblePlansCtrl from '../controllers/biblePlansController.js';

const router = express.Router();
router.use(authMiddleware);
router.use(createResourceAccess('bible-plans', query));

router.get('/', biblePlansCtrl.listBiblePlans);
router.post('/', biblePlansCtrl.createBiblePlan);
router.put('/:id', biblePlansCtrl.updateBiblePlan);
router.delete('/:id', biblePlansCtrl.deleteBiblePlan);
router.get('/:id/entries', biblePlansCtrl.listPlanEntries);
router.post('/:id/entries', biblePlansCtrl.upsertPlanEntry);

export default router;
