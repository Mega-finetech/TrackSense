-- Enable UUID generation for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','completed','paused','overdue')),
  progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_deadline ON goals(deadline);

-- Milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  due_date DATE
);

CREATE INDEX idx_milestones_goal_id ON milestones(goal_id);
CREATE INDEX idx_milestones_completed ON milestones(completed);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('planning','active','on_hold','completed')),
  deadline TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deadline ON projects(deadline);

-- Project milestones
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX idx_project_milestones_completed ON project_milestones(completed);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT NOT NULL CHECK (status IN ('todo','in_progress','done','archived')),
  due_date TIMESTAMPTZ,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recur_pattern JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Study sessions
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes >= 0),
  session_date DATE NOT NULL,
  notes TEXT
);

CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_session_date ON study_sessions(session_date);

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  credits SMALLINT NOT NULL CHECK (credits >= 0),
  status TEXT NOT NULL CHECK (status IN ('planned','active','completed','dropped'))
);

CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_courses_status ON courses(status);

-- Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  weight DECIMAL(5,2),
  grade DECIMAL(5,2),
  status TEXT NOT NULL CHECK (status IN ('pending','submitted','graded','overdue')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_status ON assignments(status);

-- Exams
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  exam_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exams_user_id ON exams(user_id);
CREATE INDEX idx_exams_course_id ON exams(course_id);
CREATE INDEX idx_exams_exam_date ON exams(exam_date);

-- Spiritual logs
CREATE TABLE spiritual_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('prayer','devotion','bible')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  log_date DATE NOT NULL,
  notes TEXT,
  details JSONB
);

CREATE INDEX idx_spiritual_logs_user_id ON spiritual_logs(user_id);
CREATE INDEX idx_spiritual_logs_type ON spiritual_logs(type);
CREATE INDEX idx_spiritual_logs_log_date ON spiritual_logs(log_date);

-- Bible study plans
CREATE TABLE bible_study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_chapters INT NOT NULL CHECK (total_chapters >= 1),
  chapters_per_day INT NOT NULL CHECK (chapters_per_day >= 1),
  start_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','completed','paused')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bible_study_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES bible_study_plans(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bible_plans_user_id ON bible_study_plans(user_id);
CREATE INDEX idx_bible_study_entries_plan_id ON bible_study_entries(plan_id);
CREATE INDEX idx_bible_study_entries_day_date ON bible_study_entries(day_date);

-- Streaks
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('prayer','devotion','bible','study','focus')),
  current_count INT NOT NULL DEFAULT 0 CHECK (current_count >= 0),
  longest_count INT NOT NULL DEFAULT 0 CHECK (longest_count >= 0),
  last_date DATE
);

CREATE UNIQUE INDEX idx_streaks_user_type ON streaks(user_id, type);
CREATE INDEX idx_streaks_user_id ON streaks(user_id);

-- Reflection journal
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  mood TEXT CHECK (mood IN ('😊','😌','🙏','💛','🌿')),
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);

-- Focus sessions
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('pomodoro','deep')),
  duration INT NOT NULL CHECK (duration >= 0),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_task_id ON focus_sessions(task_id);
CREATE INDEX idx_focus_sessions_type ON focus_sessions(type);
CREATE INDEX idx_focus_sessions_completed_at ON focus_sessions(completed_at);
