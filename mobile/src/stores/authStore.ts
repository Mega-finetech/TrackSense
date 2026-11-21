import { create } from 'zustand';
import { z } from 'zod';
import { User } from '../types';
import { acceptProviderSession, authService, type RegisterResult } from '../services/auth';
import { getSupabase, supabaseEnabled } from '../services/supabase';
import { sessionStorage } from '../services/storage';
import { queryClient } from '../services/query';
import { usePreferencesStore } from './preferencesStore';
import { authDiagnostic } from '../services/authDiagnostics';
import { ProfileSetupError } from '../services/postAuth';

const sessionSchema = z.object({
  user: z.object({
    id: z.string(), name: z.string(), email: z.string(),
    isVerified: z.boolean().optional().default(true),
    createdAt: z.string().optional(), avatar_url: z.string().optional(), created_at: z.string().optional(),
  }),
  token: z.string().min(1),
  refreshToken: z.string().optional(),
  providerSubject: z.string().optional(),
});
const SESSION_KEY = 'tracksense_session';
interface AuthState {
  user: User | null; token: string | null; refreshToken: string | null;
  isAuthenticated: boolean; isLoading: boolean; providerSubject: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<RegisterResult>;
  linkAccount: (password: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, password: string) => Promise<void>;
  refreshSession: () => Promise<string | null>;
  logout: () => Promise<void>; hydrate: () => Promise<void>;
}
export const useAuthStore = create<AuthState>((set, get) => {
  let generation = 0;
  const accept = async (response: unknown) => {
    const epoch = ++generation;
    const envelope = response as { data?: unknown };
    const session = sessionSchema.parse(envelope?.data ?? response);
    // Unverified accounts never become an authenticated session. Verification
    // issues a fresh session after the server marks the account verified.
    if (!session.user.isVerified) throw new Error('Verify your email to continue.');
    authDiagnostic('PREFERENCES_LOAD_START');
    await usePreferencesStore.getState().hydrate(session.user.id, session.token);
    if (generation !== epoch) return;
    await sessionStorage.set(SESSION_KEY, JSON.stringify(session));
    authDiagnostic('SESSION_SAVED');
    queryClient.clear();
    set({
      user: session.user as User, token: session.token, refreshToken: session.refreshToken || null,
      providerSubject: session.providerSubject || null, isAuthenticated: true, isLoading: false,
    });
    authDiagnostic('AUTH_STORE_UPDATED');
  };
  return {
    user: null, token: null, refreshToken: null, providerSubject: null, isAuthenticated: false, isLoading: true,
    login: async (email, password) => accept(await authService.login(email, password)),
    register: async (name, email, password) => {
      const response = await authService.register(name, email, password);
      if (response.verificationRequired) return response;
      try { await accept(response.session); return { ...response, verificationRequired: false }; }
      catch (error) { authDiagnostic('AUTH_STORE_FAILED', error); if (supabaseEnabled) throw new ProfileSetupError(); throw error; }
    },
    linkAccount: async password => accept(await acceptProviderSession(password)),
    verifyEmail: async (email, code) => accept(await authService.verifyEmail(email, code)),
    resendVerification: async email => authService.resendVerification(email),
    requestPasswordReset: async email => authService.requestPasswordReset(email),
    resetPassword: async (email, code, password) => accept(await authService.resetPassword(email, code, password)),
    refreshSession: async () => {
      const { refreshToken } = get();
      if (!refreshToken) return null;
      try {
        await accept(await authService.refresh(refreshToken));
        return get().token;
      } catch (error) {
        authDiagnostic('SESSION_REFRESH_FAILED', error);
        await get().logout();
        return null;
      }
    },
    logout: async () => {
      ++generation;
      const { token } = get();
      if (supabaseEnabled) {
        try { await getSupabase().auth.signOut({ scope: 'local' }); } catch { /* local cleanup below still applies */ }
      } else if (token) {
        try { await authService.logout(token); } catch { /* the local session is still cleared */ }
      }
      // Clear credentials before allowing another account into the same process.
      await Promise.all([sessionStorage.remove(SESSION_KEY), sessionStorage.remove('tracksense_token'), sessionStorage.remove('tracksense_user')]);
      await queryClient.cancelQueries();
      queryClient.clear();
      usePreferencesStore.getState().reset();
      set({ user: null, token: null, refreshToken: null, providerSubject: null, isAuthenticated: false, isLoading: false });
    },
    hydrate: async () => {
      authDiagnostic('SESSION_RESTORE_START');
      try {
        if (supabaseEnabled) {
          const { data, error } = await getSupabase().auth.getSession();
          if (error) throw error;
          if (data.session) await accept(await acceptProviderSession());
          return;
        }
        const value = await sessionStorage.get(SESSION_KEY);
        if (value) await accept(JSON.parse(value));
      } catch (error) {
        authDiagnostic('SESSION_RESTORE_FAILED', error);
        await sessionStorage.remove(SESSION_KEY);
        // A corrupt or unavailable local session returns to authentication.
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      } finally { set({ isLoading: false }); }
    },
  };
});
