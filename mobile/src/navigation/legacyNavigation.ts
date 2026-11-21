import { router, Href } from 'expo-router';

// Temporary adapter for preserved screens while each feature moves to Router hooks.
const routes: Record<string, string> = {
  CreateGoal: '/goal/new', GoalDetail: '/goal/detail', ProjectDetail: '/project/detail',
  PrayerTracker: '/spiritual/prayer', BibleStudy: '/spiritual/bible', ReflectionJournal: '/spiritual/journal',
};
export const legacyNavigation = {
  navigate: (name: string, params?: Record<string, string>) => {
    const pathname = routes[name];
    if (!pathname) throw new Error(`Unknown legacy route: ${name}`);
    router.push({ pathname, params } as Href);
  },
  goBack: () => router.back(),
};
