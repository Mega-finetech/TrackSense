import Constants, { ExecutionEnvironment } from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { createNotificationLoader, supportsNativeNotifications } from './notificationsRuntimePolicy';

export function nativeNotificationsSupported(): boolean {
  // StoreClient also describes development clients in this SDK. The Expo helper
  // distinguishes those from Expo Go; ownership is a compatibility fallback.
  return supportsNativeNotifications(
    Platform.OS,
    isRunningInExpoGo(),
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient,
    Constants.appOwnership === 'expo',
  );
}

// Type-only reference: no native notification code runs until this loader is called
// in a supported runtime. Missing native modules fail closed without crashing startup.
export const getNotifications = createNotificationLoader<typeof import('expo-notifications')>(
  nativeNotificationsSupported,
  () => import('expo-notifications'),
);

export function notificationsDisabledMessage(): string {
  return Platform.OS === 'web'
    ? 'Preferences saved. Device reminders are available in the mobile app.'
    : 'Preferences saved. Notifications will be available in the installed TrackSense build.';
}
