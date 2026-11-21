import { createResourceAccess } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as examsCtrl from '../controllers/examsController.js';

const router = express.Router();
router.use(authMiddleware);
router.use(createResourceAccess('exams', query));

router.get('/', examsCtrl.listExams);
router.post('/', examsCtrl.createExam);
router.put('/:id', examsCtrl.updateExam);
router.delete('/:id', examsCtrl.deleteExam);
router.get('/course/:courseId', examsCtrl.getExamsByCourse);

export default router;
