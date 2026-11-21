import { createClient, processLock, SupabaseClient } from '@supabase/supabase-js';
import { sessionStorage } from './storage';

export const supabaseEnabled = process.env.EXPO_PUBLIC_AUTH_PROVIDER === 'supabase';
let client: SupabaseClient | undefined;
export function getSupabase() {
  if (client) return client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase sign-in is not configured for this build.');
  const parsed = new URL(url);
  if (parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost','127.0.0.1'].includes(parsed.hostname)))) throw new Error('Invalid Supabase project URL.');
  let publicKey = key.startsWith('sb_publishable_');
  if (!publicKey) {
    try { publicKey = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'anon'; } catch { /* Reject unknown/privileged keys. */ }
  }
  if (!publicKey) throw new Error('Supabase requires a publishable or anon key, never a secret/service-role key.');
  client = createClient(url, key, { auth: { storage: { getItem: sessionStorage.get, setItem: sessionStorage.set, removeItem: sessionStorage.remove }, storageKey: 'tracksense_supabase', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, lock: processLock } });
  return client;
}
