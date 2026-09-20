import { create } from 'zustand';

const storedUser = typeof window !== 'undefined' ? window.localStorage.getItem('tracksense_user') : null;
const storedToken = typeof window !== 'undefined' ? window.localStorage.getItem('tracksense_token') : null;

export const useAuthStore = create((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,

  login: (user, token) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('tracksense_user', JSON.stringify(user));
      window.localStorage.setItem('tracksense_token', token);
    }
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('tracksense_user');
      window.localStorage.removeItem('tracksense_token');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

const storedStudyTimer = typeof window !== 'undefined' ? window.localStorage.getItem('tracksense_study_timer') : null;

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  theme: 'light',
  notifications: [],
  studyTimer: storedStudyTimer ? JSON.parse(storedStudyTimer) : null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id: Date.now() }],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  startStudyTimer: (subject) => {
    const timer = { subject, startTimestamp: Date.now() };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('tracksense_study_timer', JSON.stringify(timer));
    }
    set({ studyTimer: timer });
  },
  stopStudyTimer: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('tracksense_study_timer');
    }
    set({ studyTimer: null });
  },
}));
