import { Platform } from 'react-native';
import api from './api';
import { getNotifications } from './notificationsRuntime';
import { alertDestination } from '../features/notifications/alertPresentation';
import type { Notification } from '../types';

/**
 * Server-backed alerts shown in the Profile screen and counted by the tab
 * badge. Kept separate from the device reminder scheduler in `reminders.ts`.
 */
export async function fetchNotifications(limit = 20): Promise<Notification[]> {
  const alerts = await api.get<unknown, Notification[]>('/notifications', { params: { limit } });
  return alerts.map(alert => {
    const { targetScreen, params } = alertDestination(alert);
    return { ...alert, is_read: alert.is_read ? 1 : 0, targetScreen: targetScreen as string, params };
  });
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const result = await api.get<unknown, { unreadCount?: number }>('/notifications/unread-count');
  return Number.isFinite(result?.unreadCount) ? Math.max(0, Number(result.unreadCount)) : 0;
}

/** Marks every alert read without deleting the history shown in Profile. */
export const markAllNotificationsRead = () =>
  api.put<unknown, { success: boolean; updatedCount?: number }>('/notifications/read-all');

/**
 * Requests notification consent. Called from onboarding/space configuration so
 * the OS prompt appears in context instead of on a cold app launch.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('alerts', {
        name: 'TrackSense alerts',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}
