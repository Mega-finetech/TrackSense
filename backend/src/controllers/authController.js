import { env } from '../config/env.js';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import {
  findUserByEmail, findUserById, createUser, markUserVerified, updateUserPassword,
} from '../models/userModel.js';
import {
  createChallenge, findActiveChallenge, consumeChallenge, registerFailedAttempt,
  createSession, findActiveSession, revokeSession, revokeAllSessions,
} from '../models/authModel.js';
import {
  OTP_MAX_ATTEMPTS, OTP_RESEND_SECONDS, OTP_TTL_SECONDS, REFRESH_TTL_SECONDS,
  buildAccessToken, buildRefreshToken, codeMatches, createOtp, expiryFromNow,
  failure, hashCode, hashRefreshToken, safeUser, verifyRefreshToken,
} from '../services/authTokens.js';
import { sendOtpEmail } from '../services/email.js';

const SALT_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_MESSAGE = 'If this account needs a new code, we have sent one.';

const normalizeEmail = value => (typeof value === 'string' ? value.trim().toLowerCase() : '');
const validEmail = value => typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value);
const validPassword = value => typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value, 'utf8') <= 72;

async function issueSession(user) {
  const sessionId = randomUUID();
  const refreshToken = buildRefreshToken(user, sessionId);
  await createSession({
    id: sessionId,
    userId: user.id,
    refreshTokenHash: hashRefreshToken(refreshToken),
    expiresAt: expiryFromNow(REFRESH_TTL_SECONDS),
  });
  return {
    user: safeUser(user),
    token: buildAccessToken(user, sessionId),
    refreshToken,
  };
}

async function issueChallenge(user, purpose, { force = false } = {}) {
  const ttl = OTP_TTL_SECONDS[purpose];
  if (!force) {
    const existing = await findActiveChallenge(user.id, purpose);
    // The client shows a 60-second countdown; the server enforces it too so a
    // direct API call cannot flood an inbox.
    if (existing && Date.now() - new Date(existing.created_at).getTime() < OTP_RESEND_SECONDS * 1000) {
      return { sent: false, expiresInSeconds: ttl, resendInSeconds: OTP_RESEND_SECONDS };
    }
  }
  const code = createOtp();
  await createChallenge({
    userId: user.id,
    purpose,
    codeHash: hashCode(user.id, purpose, code),
    expiresAt: expiryFromNow(ttl),
  });
  await sendOtpEmail({ to: user.email, code, purpose, ttlSeconds: ttl });
  return { sent: true, expiresInSeconds: ttl, resendInSeconds: OTP_RESEND_SECONDS };
}

async function challengeError(user, purpose, code) {
  const challenge = await findActiveChallenge(user.id, purpose);
  if (!challenge) throw failure(400, 'That code is incorrect or has expired.', 'INVALID_OTP');
  if (new Date(challenge.expires_at).getTime() <= Date.now() || challenge.attempts >= OTP_MAX_ATTEMPTS) {
    await consumeChallenge(challenge.id);
    throw failure(400, 'That code is incorrect or has expired.', 'INVALID_OTP');
  }
  if (!codeMatches(challenge.code_hash, user.id, purpose, code)) {
    await registerFailedAttempt(challenge.id, OTP_MAX_ATTEMPTS);
    throw failure(400, 'That code is incorrect or has expired.', 'INVALID_OTP');
  }
  await consumeChallenge(challenge.id);
}

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100 ||
        !validEmail(normalizedEmail) || !validPassword(password)) {
      return res.status(400).json({ success: false, error: 'Enter a name, valid email, and a password of at least 8 characters (at most 72 bytes).' });
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser?.is_verified) {
      return res.status(409).json({ success: false, error: 'Email already in use' });
    }

    let user = existingUser;
    if (!user) {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      user = await createUser(name.trim(), normalizedEmail, passwordHash);
    }

    const challenge = await issueChallenge(user, 'verify_email');
    res.status(existingUser ? 200 : 201).json({
      success: true,
      data: {
        user: safeUser(user),
        verificationRequired: true,
        email: user.email,
        expiresInSeconds: challenge.expiresInSeconds,
        resendInSeconds: challenge.resendInSeconds,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    if (!validEmail(email) || !validPassword(password)) {
      return res.status(400).json({ success: false, error: 'Enter a valid email and password.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.is_verified) {
      const challenge = await issueChallenge(user, 'verify_email');
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        error: 'Verify your email to continue.',
        data: {
          email: user.email,
          verificationRequired: true,
          expiresInSeconds: challenge.expiresInSeconds,
          resendInSeconds: challenge.resendInSeconds,
        },
      });
    }

    res.json({ success: true, data: await issueSession(user) });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    if (!validEmail(email) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, error: 'Enter the 6-digit code from your email.', code: 'INVALID_OTP' });
    }
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ success: false, error: 'That code is incorrect or has expired.', code: 'INVALID_OTP' });
    }
    if (user.is_verified) {
      return res.status(400).json({ success: false, error: 'This email is already verified. Please sign in.', code: 'ALREADY_VERIFIED' });
    }
    await challengeError(user, 'verify_email', code);
    const verified = await markUserVerified(user.id);
    res.json({ success: true, data: await issueSession(verified) });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!validEmail(email)) {
      return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
    }
    const user = await findUserByEmail(email);
    if (user && !user.is_verified) await issueChallenge(user, 'verify_email');
    // Do not reveal whether an account exists.
    res.json({ success: true, message: RESEND_MESSAGE, data: { expiresInSeconds: OTP_TTL_SECONDS.verify_email, resendInSeconds: OTP_RESEND_SECONDS } });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!validEmail(email)) {
      return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
    }
    const user = await findUserByEmail(email);
    if (user) {
      try {
        await issueChallenge(user, 'reset_password');
      } catch (error) {
        // A delivery failure must not reveal whether the account exists.
        if (env.production) console.error('[TrackSense auth] reset email delivery failed');
      }
    }
    res.json({
      success: true,
      message: 'If this email is registered, a recovery code has been sent.',
      data: { expiresInSeconds: OTP_TTL_SECONDS.reset_password, resendInSeconds: OTP_RESEND_SECONDS },
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    const password = req.body?.password;
    if (!validEmail(email) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, error: 'Enter the 6-digit code from your email.', code: 'INVALID_OTP' });
    }
    if (!validPassword(password)) {
      return res.status(400).json({ success: false, error: 'Use at least 8 characters for your new password.' });
    }
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ success: false, error: 'That code is incorrect or has expired.', code: 'INVALID_OTP' });
    }
    await challengeError(user, 'reset_password', code);
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const updated = await updateUserPassword(user.id, passwordHash);
    // A password change invalidates every refresh session, including this one.
    await revokeAllSessions(user.id);
    res.json({ success: true, data: await issueSession(updated) });
  } catch (error) {
    next(error);
  }
};

export const refreshSession = async (req, res, next) => {
  try {
    const token = req.body?.refreshToken;
    if (typeof token !== 'string' || !token) {
      return res.status(401).json({ success: false, error: 'Your session has expired. Please sign in again.', code: 'SESSION_EXPIRED' });
    }
    const payload = verifyRefreshToken(token);
    const session = await findActiveSession({
      id: payload.sid,
      userId: payload.id,
      refreshTokenHash: hashRefreshToken(token),
    });
    if (!session) {
      return res.status(401).json({ success: false, error: 'Your session has expired. Please sign in again.', code: 'SESSION_EXPIRED' });
    }
    const user = await findUserById(payload.id);
    if (!user || !user.is_verified) {
      await revokeSession(payload.sid);
      return res.status(401).json({ success: false, error: 'Your session has expired. Please sign in again.', code: 'SESSION_EXPIRED' });
    }
    // Rotate on every use so a captured refresh token cannot be replayed.
    await revokeSession(payload.sid);
    res.json({ success: true, data: await issueSession(user) });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    if (req.user?.sid) await revokeSession(req.user.sid);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
