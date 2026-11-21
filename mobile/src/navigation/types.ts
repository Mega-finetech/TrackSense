export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  GoalsTab: undefined;
  TasksTab: undefined;
  SpiritualTab: undefined;
  MoreTab: undefined;
};

export type GoalsStackParamList = {
  GoalsList: undefined;
  GoalDetail: { goalId: string };
  CreateGoal: { goalId?: string } | undefined;
};

export type SpiritualStackParamList = {
  SpiritualHome: undefined;
  PrayerTracker: undefined;
  BibleStudy: undefined;
  ReflectionJournal: undefined;
  JournalEntryDetail: { entryId: string };
};

export type AcademicStackParamList = {
  Courses: undefined;
  Assignments: { courseId?: string } | undefined;
  Exams: undefined;
  ExamCountdown: undefined;
  StudySessions: undefined;
};

export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetail: { projectId: string };
};

export type MoreStackParamList = {
  Academic: undefined;
  Projects: undefined;
  Timer: undefined;
  Analytics: undefined;
  Settings: undefined;
} & AcademicStackParamList & ProjectsStackParamList;
