-- Account verification, one-time codes and revocable refresh sessions.
-- Existing accounts were created before verification existed, so they are
-- treated as verified; only accounts created from this migration onward start
-- unverified.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ALTER COLUMN is_verified SET DEFAULT FALSE;

CREATE TABLE auth_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_challenges_lookup ON auth_challenges(user_id, purpose, created_at DESC);
CREATE INDEX idx_auth_challenges_expiry ON auth_challenges(expires_at);

CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_active ON auth_sessions(user_id) WHERE revoked_at IS NULL;

-- Sessions stay behind the authenticated Express API. No public grants.
REVOKE ALL ON auth_challenges, auth_sessions FROM PUBLIC;
