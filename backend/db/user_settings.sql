-- User Settings/Preferences
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
  compact_view BOOLEAN NOT NULL DEFAULT FALSE,
  default_landing_page TEXT DEFAULT 'dashboard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  task_due BOOLEAN NOT NULL DEFAULT TRUE,
  exam_soon BOOLEAN NOT NULL DEFAULT TRUE,
  streak_risk BOOLEAN NOT NULL DEFAULT TRUE,
  goal_deadline BOOLEAN NOT NULL DEFAULT TRUE,
  assignment_overdue BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Profile
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
