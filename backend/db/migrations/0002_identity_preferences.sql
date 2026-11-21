-- Additive only: existing users and their resource IDs remain unchanged.
CREATE TABLE auth_identities (
  issuer TEXT NOT NULL,
  subject UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (issuer, subject),
  UNIQUE (issuer, user_id)
);

CREATE TABLE account_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  focus_areas TEXT[] NOT NULL DEFAULT ARRAY['Goals','Tasks','Focus']::TEXT[]
    CHECK (focus_areas <@ ARRAY['Goals','Tasks','Study','Spiritual','Projects','Focus']::TEXT[]),
  onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Access stays behind the authenticated Express API. No public Data API grants.
REVOKE ALL ON auth_identities, account_preferences FROM PUBLIC;
