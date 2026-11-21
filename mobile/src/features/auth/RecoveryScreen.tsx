import { useState } from 'react';
import { router } from 'expo-router';
import { Brand, Button, Field, Heading, Label, Notice, Screen } from '../../components/ui';
import { getSupabase, supabaseEnabled } from '../../services/supabase';
import { errorMessage } from '../../services/errors';

export default function RecoveryScreen() {
  const [email, setEmail] = useState(''); const [code, setCode] = useState(''); const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [error, setError] = useState('');
  async function submit() {
    setBusy(true); setError('');
    try {
      if (!supabaseEnabled) throw new Error('Password recovery requires Supabase authentication.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Enter a valid email address.');
      const auth = getSupabase().auth;
      if (!sent) {
        const { error } = await auth.resetPasswordForEmail(email.trim()); if (error) throw error; setSent(true);
      } else {
        if (password.length < 8) throw new Error('Use at least eight characters for your password.');
        const verified = await auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' }); if (verified.error) throw verified.error;
        const updated = await auth.updateUser({ password }); if (updated.error) throw updated.error;
        const signedOut = await auth.signOut({ scope: 'local' }); if (signedOut.error) throw signedOut.error;
        setDone(true);
      }
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  return <Screen><Brand /><Heading title={done ? 'Password updated.' : 'Reset your password.'} subtitle={done ? 'Sign in with your new password.' : 'Recover access to your TrackSense account.'} />
    {!done && <><Field label="Email address" value={email} onChangeText={setEmail} editable={!sent} keyboardType="email-address" autoCapitalize="none" />
      {sent && <><Label muted>If this email is registered, a recovery code has been sent.</Label><Field label="Recovery code" value={code} onChangeText={setCode} keyboardType="number-pad" /><Field label="New password" secureTextEntry value={password} onChangeText={setPassword} /></>}
      {!!error && <Notice message={error} />}<Button title={sent ? 'Update password' : 'Send recovery email'} loading={busy} onPress={submit} /></>}
    <Button secondary title="Back to sign in" disabled={busy} onPress={() => router.replace('/login')} />
  </Screen>;
}
