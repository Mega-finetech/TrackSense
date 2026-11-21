export interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: 'Academic' | 'Spiritual' | 'Career' | 'Health' | 'Personal' | 'Financial';
  status: 'active' | 'completed' | 'paused' | 'overdue';
  progress: number;
  deadline?: string;
  created_at: string;
  updated_at?: string;
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  completed: number;
  completed_at?: string;
  due_date?: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  deadline?: string;
  notes?: string;
  created_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  completed: number;
  due_date?: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  goal_id?: string;
  project_id?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  due_date?: string;
  is_recurring: number;
  recur_pattern?: string;
  created_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject: string;
  duration_minutes: number;
  session_date: string;
  notes?: string;
}

export interface CourseTopic {
  id: string;
  title: string;
  completed: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Course {
  id: string;
  user_id: string;
  name: string;
  code?: string;
  credits: number;
  status: 'planned' | 'active' | 'completed' | 'dropped';
  /** Syllabus checklist persisted with the course. */
  topics: CourseTopic[];
  /** Ordered syllabus modules used by the roadmap badge. */
  modules: CourseModule[];
}

export interface Assignment {
  id: string;
  user_id: string;
  course_id?: string;
  title: string;
  /** Normalised camelCase due date used by the Study view models. */
  dueDate?: string;
  isCompleted: boolean;
  /** Only graded assignments contribute to the cumulative course score. */
  earnedScore?: number;
  totalScore?: number;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  created_at: string;
}

/** Shape returned by the legacy REST endpoints before view-model mapping. */
export interface AssignmentRecord {
  id: string;
  user_id: string;
  course_id?: string;
  title: string;
  due_date?: string;
  earned_score?: number | string | null;
  total_score?: number | string | null;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  created_at: string;
}

export interface Exam {
  id: string;
  user_id: string;
  course_id?: string;
  subject: string;
  exam_date: string;
  location?: string;
  created_at: string;
}

export interface SpiritualLog {
  id: string;
  user_id: string;
  type: 'prayer' | 'devotion' | 'bible';
  completed: number;
  log_date: string;
  notes?: string;
  details?: Record<string, boolean>;
}

export interface BibleStudyPlan {
  id: string;
  user_id: string;
  title: string;
  total_chapters: number;
  chapters_per_day: number;
  start_date: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

export interface BibleStudyEntry {
  id: string;
  plan_id: string;
  day_date: string;
  completed: number;
  notes?: string;
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  type: 'prayer' | 'devotion' | 'bible' | 'study' | 'focus';
  current_count: number;
  longest_count: number;
  last_date?: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  title?: string;
  body: string;
  mood?: string;
  tags: string[];
  created_at: string;
  updated_at?: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  task_id?: string;
  type: 'pomodoro' | 'deep';
  duration: number;
  completed_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  related_id?: string;
  is_read: number;
  created_at: string;
  /** Deep-link destination resolved by alert presentation. */
  targetScreen?: string;
  params?: Record<string, string>;
}

export interface UserSettings {
  id: string;
  user_id: string;
  dark_mode: number;
  compact_view: number;
  default_landing_page: string;
  updated_at?: string;
}

export interface DashboardSummary {
  tasksDueToday: number;
  activeGoals: number;
  studyHoursThisWeek: number;
  prayerStreak: number;
  focusSessionsThisWeek: number;
  upcomingTasks: Task[];
  goalsProgress: { id: string; title: string; progress: number }[];
  spiritualConsistency: { date: string; completed: boolean }[];
}

export interface AnalyticsData {
  productivity: any;
  goals: any;
  study: any;
  spiritual: any;
  review: string;
}
