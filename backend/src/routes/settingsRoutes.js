import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as settingsCtrl from '../controllers/settingsController.js';

const router = express.Router();
router.use(authMiddleware);

// Profile endpoints
router.get('/profile', settingsCtrl.getUserProfile);
router.put('/profile', settingsCtrl.updateUserProfile);

// Settings endpoints
router.get('/display', settingsCtrl.getUserSettings);
router.put('/display', settingsCtrl.updateUserSettings);

// Notification preferences endpoints
router.get('/notifications', settingsCtrl.getNotificationPreferences);
router.put('/notifications', settingsCtrl.updateNotificationPreferences);

// Data export
router.get('/export', settingsCtrl.exportUserData);

// Account deletion
router.delete('/account', settingsCtrl.deleteAccount);

export default router;
