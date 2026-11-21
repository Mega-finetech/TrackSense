import { createResourceAccess } from '../middleware/resourceAccess.js';
import { query } from '../utils/db.js';
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as notificationsCtrl from '../controllers/notificationsController.js';

const router = express.Router();
router.use(authMiddleware);
router.use(createResourceAccess('notifications', query));

router.get('/', notificationsCtrl.listNotifications);
router.get('/unread-count', notificationsCtrl.getUnreadCount);
router.post('/check', notificationsCtrl.checkNotifications);
router.put('/read-all', notificationsCtrl.markAllAsRead);
router.put('/:notificationId/read', notificationsCtrl.markNotificationAsRead);
router.delete('/clear-all', notificationsCtrl.clearAllNotifications);

// Cron endpoint - check all users
router.post('/cron/check-all', notificationsCtrl.checkAllNotifications);

export default router;
