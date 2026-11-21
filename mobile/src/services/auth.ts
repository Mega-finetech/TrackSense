import apiClient from './api';
import { getSupabase, supabaseEnabled } from './supabase';
import { authDiagnostic } from './authDiagnostics';
import { finishSignup, isExistingAccount } from './postAuth';
import type { User } from '../types';

export type AuthSession = {
  user: User;
  token: string;
  refreshToken?: string;
  providerSubject?: string;
};

export type RegisterResult =
  | { verificationRequired: true; email: string; expiresInSeconds?: number; resendInSeconds?: number }
  | { verificationRequired: false; email: string; session: AuthSession };

export class EmailNotVerifiedError extends Error {
  email: string;
  constructor(email: string) {
    super('Verify your email to continue.');
    this.name = 'EmailNotVerifiedError';
    this.email = email;
  }
}

function envelope<T>(response: unknown): T {
  const value = response as { data?: T };
  return (value?.data ?? response) as T;
}

function isUnverifiedResponse(error: unknown) {
  const value = error as { response?: { status?: number; data?: { code?: string; data?: { email?: string } } } };
  return value?.response?.status === 403 &&
    value.response.data?.code === 'EMAIL_NOT_VERIFIED' &&
    typeof value.response.data?.data?.email === 'string';
}

export async function acceptProviderSession(legacyPassword?: string): Promise<{ data: AuthSession }> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) { authDiagnostic('SESSION_LOOKUP_FAILED', error); throw error; }
  if (!data.session) { authDiagnostic('SESSION_UNAVAILABLE'); throw new Error('Please sign in again.'); }
  authDiagnostic('SESSION_AVAILABLE');
  authDiagnostic('BACKEND_LINK_START');
  try {
  const response = await apiClient.post<unknown, { data: { user: User; token: string; refreshToken?: string } }>('/auth/supabase/session', { ...(legacyPassword !== undefined ? { legacyPassword } : {}) }, { headers: { Authorization: `Bearer ${data.session.access_token}` } });
  authDiagnostic('BACKEND_LINK_OK');
  return { data: { ...response.data, providerSubject: data.session.user.id } };
  } catch (error) { authDiagnostic('BACKEND_LINK_FAILED', error); throw error; }
}

export const authService = {
  async register(name: string, email: string, password: string): Promise<RegisterResult> {
    if (supabaseEnabled) {
      const { data, error } = await getSupabase().auth.signUp({ email, password, options: { data: { name } } });
      if (error) { authDiagnostic('SUPABASE_SIGNUP_FAILED', error); if (isExistingAccount(error)) throw new Error('This email is already registered. Please sign in instead.'); throw error; }
      authDiagnostic('SUPABASE_SIGNUP_OK');
      if (!data.session) authDiagnostic('EMAIL_VERIFICATION_REQUIRED');
      const result = await finishSignup(data, () => acceptProviderSession());
      if ('verificationRequired' in result) return { verificationRequired: true, email };
      return { verificationRequired: false, email, session: envelope<AuthSession>(result) };
    }
    const data = envelope<{ user: User; verificationRequired: true; email: string; expiresInSeconds?: number; resendInSeconds?: number }>(
      await apiClient.post('/auth/register', { name, email, password })
    );
    return {
      verificationRequired: true,
      email: data.email || email,
      expiresInSeconds: data.expiresInSeconds,
      resendInSeconds: data.resendInSeconds,
    };
  },

  async login(email: string, password: string): Promise<AuthSession | { data: AuthSession }> {
    if (supabaseEnabled) {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) throw error;
      authDiagnostic('SUPABASE_LOGIN_OK');
      return acceptProviderSession();
    }
    try {
      return envelope<AuthSession>(await apiClient.post('/auth/login', { email, password }));
    } catch (error) {
      if (isUnverifiedResponse(error)) throw new EmailNotVerifiedError((error as { response: { data: { data: { email: string } } } }).response.data.data.email);
      throw error;
    }
  },

  async verifyEmail(email: string, code: string): Promise<AuthSession | { data: AuthSession }> {
    if (supabaseEnabled) {
      const { error } = await getSupabase().auth.verifyOtp({ email, token: code, type: 'signup' });
      if (error) throw error;
      authDiagnostic('EMAIL_VERIFIED');
      return acceptProviderSession();
    }
    return envelope<AuthSession>(await apiClient.post('/auth/verify-email', { email, code }));
  },

  async resendVerification(email: string) {
    if (supabaseEnabled) {
      const { error } = await getSupabase().auth.resend({ type: 'signup', email });
      if (error) throw error;
      return;
    }
    await apiClient.post('/auth/resend-verification', { email });
  },

  async requestPasswordReset(email: string) {
    if (supabaseEnabled) {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email);
      if (error) throw error;
      return;
    }
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(email: string, code: string, password: string): Promise<AuthSession | { data: AuthSession }> {
    if (supabaseEnabled) {
      const auth = getSupabase().auth;
      const verified = await auth.verifyOtp({ email, token: code, type: 'recovery' });
      if (verified.error) throw verified.error;
      const updated = await auth.updateUser({ password });
      if (updated.error) throw updated.error;
      // Invalidate every provider session, then sign in with the new password.
      await auth.signOut({ scope: 'global' });
      const signedIn = await auth.signInWithPassword({ email, password });
      if (signedIn.error) throw signedIn.error;
      return acceptProviderSession();
    }
    return envelope<AuthSession>(await apiClient.post('/auth/reset-password', { email, code, password }));
  },

  async refresh(refreshToken: string): Promise<AuthSession> {
    return envelope<AuthSession>(await apiClient.post('/auth/refresh', { refreshToken }, { headers: { Authorization: '' } }));
  },

  async logout(token: string) {
    await apiClient.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
  },

  async getCurrentUser() {
    return apiClient.get('/auth/me');
  },
};
