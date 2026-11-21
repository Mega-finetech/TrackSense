import { createResourceAccess } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as studySessionsCtrl from '../controllers/studySessionsController.js';

const router = express.Router();
router.use(authMiddleware);
router.use(createResourceAccess('study-sessions', query));

router.get('/', studySessionsCtrl.listStudySessions);
router.post('/', studySessionsCtrl.createStudySession);
router.put('/:id', studySessionsCtrl.updateStudySession);
router.delete('/:id', studySessionsCtrl.deleteStudySession);
router.get('/weekly-hours', studySessionsCtrl.getWeeklyStudyHours);

export default router;
