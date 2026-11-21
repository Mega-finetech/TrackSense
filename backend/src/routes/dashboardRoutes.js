import authMiddleware from '../middleware/authMiddleware.js';
import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/summary', authMiddleware, getDashboardSummary);

export default router;
