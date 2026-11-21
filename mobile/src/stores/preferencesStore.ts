import { create } from 'zustand';
import { storage } from '../services/storage';
import api from '../services/api';
import { errorMessage } from '../services/errors';
import { ThemeMode } from '../theme/tokens';

export const focusAreas = ['Goals', 'Tasks', 'Study', 'Spiritual', 'Projects', 'Focus'] as const;
export type FocusArea = typeof focusAreas[number];
type Preferences = { focusAreas: FocusArea[]; onboarded: boolean; theme: ThemeMode; revision: number };
interface PreferenceState extends Preferences {
  userId: string | null; syncError: string; saving: boolean;
  hydrate: (id: string, token?: string) => Promise<void>;
  reload: () => Promise<void>;
  saveTheme: (theme: ThemeMode) => Promise<void>;
  save: (areas: FocusArea[]) => Promise<void>;
  saveSelection: (areas: FocusArea[]) => Promise<void>;
  reset: () => void;
}
const defaults: Preferences = { focusAreas: ['Goals', 'Tasks', 'Focus'], onboarded: false, theme: 'system', revision: 0 };
function parse(value: unknown): Preferences {
  const record = value as Partial<Preferences>;
  if (!record || !Array.isArray(record.focusAreas) || record.focusAreas.some(area => !focusAreas.includes(area)) || typeof record.onboarded !== 'boolean') throw new Error('Invalid saved preferences');
  return { focusAreas: [...new Set(record.focusAreas)], onboarded: record.onboarded, theme: ['light','dark','system'].includes(record.theme || '') ? record.theme! : 'system', revision: Number.isInteger(record.revision) && record.revision! >= 0 ? record.revision! : 0 };
}
export const usePreferencesStore = create<PreferenceState>((set, get) => {
  let generation = 0;
  const write = async (changes: Partial<Preferences>) => {
    const state = get(); const epoch = generation;
    if (!state.userId) throw new Error('Please sign in again.');
    if (state.saving) throw new Error('Please wait for your preferences to finish saving.');
    set({ saving: true });
    try {
      const { useAuthStore } = await import('./authStore');
      const auth = useAuthStore.getState();
      if (generation !== epoch || auth.user?.id !== state.userId || !auth.token) throw new Error('Your session changed. Please try again.');
      const values = { focusAreas: state.focusAreas, onboarded: state.onboarded, theme: state.theme, revision: state.revision, ...changes };
      const saved = parse(await api.put('/preferences', values, { headers: { Authorization: `Bearer ${auth.token}` } }));
      await storage.set(`tracksense_preferences_${state.userId}`, JSON.stringify(saved));
      if (generation === epoch) set({ ...saved, syncError: '' });
    } catch (error) {
      if (generation === epoch) set({ syncError: errorMessage(error) });
      throw error;
    } finally { if (generation === epoch) set({ saving: false }); }
  };
  return {
    ...defaults, userId: null, syncError: '', saving: false,
    hydrate: async (userId, token) => {
      const epoch = ++generation;
      set({ ...defaults, userId, syncError: '', saving: false });
      let local = defaults;
      try {
        const saved = await storage.get(`tracksense_preferences_${userId}`);
        if (saved) local = parse(JSON.parse(saved));
        else {
          const theme = await storage.get('tracksense_theme');
          if (theme === 'light' || theme === 'dark') local = { ...defaults, theme };
        }
      } catch { /* Invalid local cache cannot overwrite cloud preferences. */ }
      if (generation !== epoch) return;
      set(local);
      try {
        if (!token) throw new Error('Sign in to synchronize your preferences.');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const remote = await api.get<unknown, Preferences | null>('/preferences', config);
        const saved = remote === null ? parse(await api.put('/preferences', { ...local, revision: 0 }, config)) : parse(remote);
        await storage.set(`tracksense_preferences_${userId}`, JSON.stringify(saved));
        if (generation === epoch) set({ ...saved, syncError: '' });
      } catch (error) { if (generation === epoch) set({ syncError: errorMessage(error) }); }
    },
    reload: async () => { const { useAuthStore } = await import('./authStore'); const auth = useAuthStore.getState(); if (auth.user?.id && auth.token) await get().hydrate(auth.user.id, auth.token); },
    save: areas => write({ focusAreas: areas, onboarded: true }),
    saveSelection: areas => write({ focusAreas: areas }),
    saveTheme: theme => write({ theme }),
    reset: () => { ++generation; set({ ...defaults, userId: null, syncError: '', saving: false }); },
  };
});
