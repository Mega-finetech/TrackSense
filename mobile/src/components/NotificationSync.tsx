import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import { getNotifications } from '../services/notificationsRuntime';
import { alertDestination } from '../features/notifications/alertPresentation';
import type { Notification } from '../types';

type ExpoNotification = import('expo-notifications').Notification;

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function pushAlert(notification: ExpoNotification): Notification {
  const content = notification.request.content;
  const data = content.data ?? {};
  const alert = {
    id: text(data.notificationId, notification.request.identifier),
    user_id: text(data.user_id),
    type: text(data.type, 'system'),
    title: text(content.title, 'TrackSense'),
    message: text(content.body, text(data.message)),
    related_id: text(data.related_id) || undefined,
    is_read: 0,
    created_at: new Date().toISOString(),
  };
  const { targetScreen, params } = alertDestination(alert);
  return { ...alert, targetScreen: targetScreen as string, params };
}

/**
 * Keeps the unread badge and Profile alert stack in sync with the server and
 * with push payloads. It sits above the navigator so it survives tab changes.
 */
export function NotificationSync() {
  const userId = useAuthStore(state => state.user?.id);
  const load = useNotificationsStore(state => state.load);
  const reset = useNotificationsStore(state => state.reset);
  const receivePush = useNotificationsStore(state => state.receivePush);

  useEffect(() => {
    if (!userId) {
      reset();
      return;
    }
    void load();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void load();
    });
    return () => subscription.remove();
  }, [userId, load, reset]);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    void getNotifications().then(Notifications => {
      if (disposed || !Notifications) return;
      const received = Notifications.addNotificationReceivedListener(notification => {
        if (!disposed) receivePush(pushAlert(notification));
      });
      const opened = Notifications.addNotificationResponseReceivedListener(response => {
        if (disposed) return;
        const data = response.notification.request.content.data ?? {};
        const { targetScreen, params } = alertDestination({
          type: text(data.type, 'system'),
          related_id: text(data.related_id) || undefined,
        });
        router.push({ pathname: targetScreen as string, params });
        void load();
      });
      cleanup = () => {
        received.remove();
        opened.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [receivePush, load]);

  return null;
}
