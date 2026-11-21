import { safeErrorCode } from '../utils/safeError.js';
import * as notificationsModel from '../models/notificationsModel.js';

export const listNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const notifications = await notificationsModel.getNotifications(userId, Number(limit));
    res.json(notifications);
  } catch (error) {
    console.error('Error listing notifications:', safeErrorCode(error));
    res.status(500).json({ error: 'Failed to list notifications' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationsModel.getUnreadCount(userId);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error getting unread count:', safeErrorCode(error));
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await notificationsModel.markAsRead(notificationId);
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', safeErrorCode(error));
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationsModel.markAllAsRead(userId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error marking notifications as read:', safeErrorCode(error));
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationsModel.clearAllNotifications(userId);
    res.json(result);
  } catch (error) {
    console.error('Error clearing notifications:', safeErrorCode(error));
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
};

export const checkNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await notificationsModel.generateNotifications(userId);
    res.json({ generated: notifications, count: notifications.length });
  } catch (error) {
    console.error('Error checking notifications:', safeErrorCode(error));
    res.status(500).json({ error: 'Failed to check notifications' });
  }
};

// Cron endpoint (admin/internal use only - requires special auth or env check)
export const checkAllNotifications = async (req, res) => {
  try {
    // Optional: Add authorization check here (e.g., API key or internal request)
    const result = await notificationsModel.checkAllUsersNotifications();
    res.json(result);
  } catch (error) {
    console.error('Error in cron check:', safeErrorCode(error));
    res.status(500).json({ error: 'Failed to check notifications' });
  }
};
