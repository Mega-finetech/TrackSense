import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { queryClient } from '../services/query';
import { syncReminders } from '../services/reminders';
import { getNotifications } from '../services/notificationsRuntime';

export function ReminderSync() {
  const id = useAuthStore(state => state.user?.id);
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void getNotifications().then(Notifications => {
      if (disposed || !Notifications) return;
      Notifications.setNotificationHandler({
        handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
      });
      const refresh = () => { if (!disposed) void syncReminders().catch(() => {}); };
      const app = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
      let timer: ReturnType<typeof setTimeout> | undefined;
      const stop = queryClient.getQueryCache().subscribe(event => {
        if (event.type === 'updated' && ['tasks', 'goals', 'exams', 'spiritual'].includes(String(event.query.queryKey[0]))) {
          clearTimeout(timer);
          timer = setTimeout(refresh, 1500);
        }
      });
      cleanup = () => { app.remove(); stop(); clearTimeout(timer); };
      refresh();
    }).catch(() => { /* Unavailable native notifications must not prevent startup. */ });
    return () => { disposed = true; cleanup?.(); };
  }, [id]);
  return null;
}
