import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') { window.localStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    if (Platform.OS === 'web') { window.localStorage.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  },
};

// Web previews keep credentials in session storage; native credentials use SecureStore.
export const sessionStorage = {
  async get(key: string) {
    return Platform.OS === 'web' ? (typeof window === 'undefined' ? null : window.sessionStorage.getItem(key)) : SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') { window.sessionStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    if (Platform.OS === 'web') { window.sessionStorage.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  },
};
