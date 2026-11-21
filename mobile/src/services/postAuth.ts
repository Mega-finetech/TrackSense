export const profileSetupMessage = 'Your account was created, but we could not finish setting up your TrackSense profile. Please try signing in again.';
export class ProfileSetupError extends Error {
  constructor() { super(profileSetupMessage); this.name = 'ProfileSetupError'; }
}
export function isExistingAccount(error: unknown) {
  return ['user_already_exists', 'email_exists'].includes((error as { code?: string })?.code || '');
}
// Supabase may obscure an existing confirmed account with an empty identities list.
export async function finishSignup<T>(data: { user: { identities?: unknown[] } | null; session: unknown }, link: () => Promise<T>): Promise<T | { verificationRequired: true }> {
  if (data.user?.identities?.length === 0) throw new Error('This email is already registered. Please sign in instead.');
  if (!data.session) return { verificationRequired: true };
  try { return await link(); } catch { throw new ProfileSetupError(); }
}
