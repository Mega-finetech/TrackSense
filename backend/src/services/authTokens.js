import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const OTP_LENGTH = 6;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_SECONDS = 60;
export const OTP_TTL_SECONDS = {
  verify_email: 60,
  reset_password: 10 * 60,
};
export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

export const failure = (status, message, code) =>
  Object.assign(new Error(message), { status, ...(code ? { code } : {}) });

export function createOtp() {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
}

// Codes are short, so a keyed digest prevents a database leak from being
// brute-forced with a precomputed table.
export function hashCode(userId, purpose, code) {
  return createHmac('sha256', env.jwtSecret)
    .update(`${purpose}:${userId}:${code}`)
    .digest('hex');
}

export function codeMatches(expectedHash, userId, purpose, code) {
  const actual = Buffer.from(hashCode(userId, purpose, code), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function expiryFromNow(seconds, now = Date.now()) {
  return new Date(now + seconds * 1000);
}

export function buildAccessToken(user, sessionId, config = env) {
  return jwt.sign(
    { id: user.id, email: user.email, sid: sessionId, type: 'access' },
    config.jwtSecret,
    { algorithm: 'HS256', expiresIn: config.jwtExpiresIn }
  );
}

export function buildRefreshToken(user, sessionId, config = env) {
  return jwt.sign(
    { id: user.id, sid: sessionId, type: 'refresh' },
    config.jwtSecret,
    { algorithm: 'HS256', expiresIn: REFRESH_TTL_SECONDS }
  );
}

export function verifyRefreshToken(token, config = env) {
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    throw failure(401, 'Your session has expired. Please sign in again.');
  }
  if (payload?.type !== 'refresh' || typeof payload.id !== 'string' || typeof payload.sid !== 'string') {
    throw failure(401, 'Your session has expired. Please sign in again.');
  }
  return payload;
}

export function hashRefreshToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function safeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isVerified: user.is_verified === true,
    createdAt: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
  };
}
