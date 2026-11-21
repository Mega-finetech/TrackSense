import { env } from '../config/env.js';
import jwt from 'jsonwebtoken';
import { query } from '../utils/db.js';
import { verifySupabaseToken, findIdentity } from '../services/supabaseIdentity.js';

const JWT_SECRET = env.jwtSecret;

export function createAuthMiddleware(queryAccount = query) {
return function authMiddleware(req, res, next) {
  const acceptUser = async user => {
    const found = (await queryAccount(
      `SELECT u.id, u.is_verified, s.revoked_at, s.expires_at
       FROM users u
       LEFT JOIN auth_sessions s ON s.id = $2 AND s.user_id = u.id
       WHERE u.id = $1 AND NOT EXISTS (SELECT 1 FROM account_deletions WHERE user_id = $1)`,
      [user.id, user.sid || null]
    )).rows[0];
    if (!found) return res.status(401).json({ error: 'Account unavailable. Please sign in again.' });
    if (found.is_verified === false) {
      return res.status(403).json({ success: false, error: 'Verify your email to continue.', code: 'EMAIL_NOT_VERIFIED' });
    }
    // Tokens issued before sessions existed (or Supabase access tokens) have
    // no sid. New tokens are checked against their server-side session so a
    // password reset revokes them immediately.
    if (user.sid) {
      if (found.revoked_at || !found.expires_at || new Date(found.expires_at).getTime() <= Date.now()) {
        return res.status(401).json({ success: false, error: 'Your session has expired. Please sign in again.', code: 'SESSION_EXPIRED' });
      }
    }
    req.user = user; next();
  };
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  if (env.authProvider === 'supabase') {
    verifySupabaseToken(token).then(identity => findIdentity(query, identity)).then(user => {
      if (!user) return res.status(401).json({ error: 'Complete account setup before continuing.' });
      return acceptUser(user);
    }).catch(next);
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload !== 'object' || typeof payload.id !== 'string' || !payload.id || payload.type === 'refresh') {
      return res.status(401).json({ success: false, error: 'Invalid session' });
    }
    acceptUser(payload).catch(next);
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

}
export default createAuthMiddleware();
