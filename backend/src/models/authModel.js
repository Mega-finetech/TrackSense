import { query } from '../utils/db.js';

export const createChallenge = async ({ userId, purpose, codeHash, expiresAt }) => {
  const client = (sql, params) => query(sql, params);
  // Only the newest challenge for a purpose can succeed.
  await client(
    `UPDATE auth_challenges SET consumed_at = NOW()
     WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [userId, purpose]
  );
  const result = await client(
    `INSERT INTO auth_challenges (user_id, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, purpose, codeHash, expiresAt]
  );
  return result.rows[0];
};

export const findActiveChallenge = async (userId, purpose) => {
  const result = await query(
    `SELECT * FROM auth_challenges
     WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId, purpose]
  );
  return result.rows[0];
};

export const findLatestChallenge = findActiveChallenge;

export const consumeChallenge = async (id) => {
  const result = await query(
    `UPDATE auth_challenges SET consumed_at = NOW()
     WHERE id = $1 AND consumed_at IS NULL RETURNING id`,
    [id]
  );
  return result.rows[0];
};

export const registerFailedAttempt = async (id, maxAttempts) => {
  const result = await query(
    `UPDATE auth_challenges
     SET attempts = attempts + 1,
         consumed_at = CASE WHEN attempts + 1 >= $2 THEN NOW() ELSE consumed_at END
     WHERE id = $1 AND consumed_at IS NULL
     RETURNING attempts, consumed_at`,
    [id, maxAttempts]
  );
  return result.rows[0];
};

export const createSession = async ({ id, userId, refreshTokenHash, expiresAt }) => {
  const result = await query(
    `INSERT INTO auth_sessions (id, user_id, refresh_token_hash, expires_at)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [id, userId, refreshTokenHash, expiresAt]
  );
  return result.rows[0];
};

export const findActiveSession = async ({ id, userId, refreshTokenHash }) => {
  const result = await query(
    `SELECT * FROM auth_sessions
     WHERE id = $1 AND user_id = $2 AND refresh_token_hash = $3
       AND revoked_at IS NULL AND expires_at > NOW()`,
    [id, userId, refreshTokenHash]
  );
  return result.rows[0];
};

export const revokeSession = async (id) => {
  const result = await query(
    `UPDATE auth_sessions SET revoked_at = NOW()
     WHERE id = $1 AND revoked_at IS NULL RETURNING id`,
    [id]
  );
  return result.rows[0];
};

export const revokeAllSessions = async (userId) => {
  const result = await query(
    `UPDATE auth_sessions SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
  return result.rowCount;
};
