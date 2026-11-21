import authMiddleware from '../middleware/authMiddleware.js';
import { findUserById } from '../models/userModel.js';
import express from 'express';
import {
  registerUser, loginUser, verifyEmail, resendVerification, forgotPassword,
  resetPassword, refreshSession, logoutUser,
} from '../controllers/authController.js';
import { safeUser } from '../services/authTokens.js';
import { env } from '../config/env.js';
import pool from '../utils/db.js';
import { provisionIdentity, verifySupabaseToken } from '../services/supabaseIdentity.js';
import { safeErrorCode } from '../utils/safeError.js';

const router = express.Router();
const diagnostic = (stage, error) => {
  if (process.env.NODE_ENV === 'production') return;
  if (!error) return console.info(`[TrackSense auth] ${stage}`);
  console.info(`[TrackSense auth] ${stage}`, {
    code: safeErrorCode(error),
    status: Number.isInteger(error.status) ? error.status : 500,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
};

const legacyOnly = (req, res, next) => env.authProvider === 'legacy' ? next() : res.status(409).json({ error: 'Use Supabase sign-in for this server.' });
router.post('/register', legacyOnly, registerUser);
router.post('/login', legacyOnly, loginUser);
router.post('/verify-email', legacyOnly, verifyEmail);
router.post('/resend-verification', legacyOnly, resendVerification);
router.post('/forgot-password', legacyOnly, forgotPassword);
router.post('/reset-password', legacyOnly, resetPassword);
router.post('/refresh', legacyOnly, refreshSession);
router.post('/logout', authMiddleware, logoutUser);
router.get('/config', (req, res) => res.json({ provider: env.authProvider }));
router.post('/supabase/session', async (req, res, next) => {
  diagnostic('BACKEND_LINK_RECEIVED');
  try {
  if (env.authProvider !== 'supabase') return res.status(409).json({ error: 'This server has not enabled Supabase sign-in yet.' });
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (req.body?.legacyPassword !== undefined && (typeof req.body.legacyPassword !== 'string' || Buffer.byteLength(req.body.legacyPassword) > 72)) return res.status(400).json({ error: 'Invalid account linking password' });
  const identity = await verifySupabaseToken(token);
  diagnostic('SUPABASE_SESSION_VERIFIED');
  const user = await provisionIdentity(pool, identity, req.body?.legacyPassword);
  diagnostic('BACKEND_LINK_OK');
  res.json({ success: true, data: { user, token } });
  } catch (error) { diagnostic('BACKEND_LINK_FAILED', error); next(error); }
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Session expired' });
  res.json({ success: true, data: safeUser(user) });
});

export default router;
