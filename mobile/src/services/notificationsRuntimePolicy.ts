/** Pure policy/loader kept independent of native modules for startup regression tests. */
export function supportsNativeNotifications(platform: string, expoGo: boolean, storeClient: boolean, expoOwnership: boolean): boolean {
  return platform !== 'web' && !expoGo && !(storeClient && expoOwnership);
}
export function createNotificationLoader<T>(supported: () => boolean, load: () => Promise<T>) {
  let pending: Promise<T | null> | undefined;
  return (): Promise<T | null> => {
    if (!supported()) return Promise.resolve(null);
    if (!pending) pending = load().catch(() => null);
    return pending;
  };
}
