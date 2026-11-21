import { create } from 'zustand';
import type { Notification } from '../types';
import { fetchNotifications, fetchUnreadNotificationCount, markAllNotificationsRead } from '../services/notifications';
import { errorMessage } from '../services/errors';

interface NotificationsState {
  unreadCount: number;
  alerts: Notification[];
  loading: boolean;
  error: string;
  load: () => Promise<void>;
  clearUnreadAlerts: () => Promise<void>;
  receivePush: (alert: Notification) => void;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  unreadCount: 0,
  alerts: [],
  loading: false,
  error: '',

  load: async () => {
    set({ loading: true, error: '' });
    try {
      const [alerts, unreadCount] = await Promise.all([
        fetchNotifications(),
        fetchUnreadNotificationCount(),
      ]);
      set({ alerts, unreadCount, loading: false });
    } catch (cause) {
      set({ loading: false, error: errorMessage(cause) });
    }
  },

  clearUnreadAlerts: async () => {
    // Clear locally first so the tab badge disappears the moment Profile opens.
    set(state => ({
      unreadCount: 0,
      alerts: state.alerts.map(alert => ({ ...alert, is_read: 1 })),
    }));
    try {
      await markAllNotificationsRead();
    } catch {
      // Local clearing still satisfies the focus behaviour; the next load will
      // reconcile with the server if it is temporarily unreachable.
    }
  },

  receivePush: (alert) => {
    set(state => {
      const existing = state.alerts.some(item => item.id === alert.id);
      return {
        alerts: existing
          ? state.alerts.map(item => (item.id === alert.id ? alert : item))
          : [alert, ...state.alerts].slice(0, 20),
        unreadCount: existing ? state.unreadCount : state.unreadCount + 1,
      };
    });
  },

  reset: () => {
    if (!get().unreadCount && !get().alerts.length && !get().error) return;
    set({ unreadCount: 0, alerts: [], loading: false, error: '' });
  },
}));
