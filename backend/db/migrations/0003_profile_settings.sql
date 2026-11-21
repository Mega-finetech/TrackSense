ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS focus_sessions BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS weekly_review BOOLEAN NOT NULL DEFAULT TRUE;
-- Durable deletion queue. Retain provider subjects to prevent stale sessions reprovisioning.
CREATE TABLE account_deletions (
  user_id UUID PRIMARY KEY,
  identities JSONB NOT NULL DEFAULT '[]',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

REVOKE ALL ON account_deletions FROM PUBLIC;
