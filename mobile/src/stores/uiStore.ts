import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark';
  notifications: any[];
  studyTimer: { subject: string; startTimestamp: number } | null;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: any) => void;
  removeNotification: (id: number) => void;
  startStudyTimer: (subject: string) => void;
  stopStudyTimer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  notifications: [],
  studyTimer: null,

  setTheme: (theme) => set({ theme }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id: Date.now() }],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  startStudyTimer: (subject) =>
    set({ studyTimer: { subject, startTimestamp: Date.now() } }),

  stopStudyTimer: () => set({ studyTimer: null }),
}));
