import { createResourceAccess } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as assignmentsCtrl from '../controllers/assignmentsController.js';

const router = express.Router();
router.use(authMiddleware);
router.use(createResourceAccess('assignments', query));

router.get('/', assignmentsCtrl.listAssignments);
router.post('/', assignmentsCtrl.createAssignment);
router.put('/:id', assignmentsCtrl.updateAssignment);
router.delete('/:id', assignmentsCtrl.deleteAssignment);
router.get('/course/:courseId', assignmentsCtrl.getAssignmentsByCourse);

export default router;
