import { createResourceAccess } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as coursesCtrl from '../controllers/coursesController.js';

const router = express.Router();
router.use(authMiddleware);
router.use(createResourceAccess('courses', query));

router.get('/', coursesCtrl.listCourses);
router.post('/', coursesCtrl.createCourse);
router.put('/:id', coursesCtrl.updateCourse);
router.delete('/:id', coursesCtrl.deleteCourse);

export default router;
