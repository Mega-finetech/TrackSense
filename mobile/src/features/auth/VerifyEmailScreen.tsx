import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Brand, Button, Heading, Label, Screen } from '../../components/ui';
import { OtpInput } from '../../components/OtpInput';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { errorMessage } from '../../services/errors';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = (Array.isArray(params.email) ? params.email[0] : params.email) || '';
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(candidate = code) {
    if (busy) return;
    if (!email) { setError('Enter your email again so we can verify your account.'); return; }
    if (candidate.length !== 6) { setError('Enter all 6 digits from your email.'); return; }
    setBusy(true); setError('');
    try {
      await useAuthStore.getState().verifyEmail(email, candidate);
      router.replace('/');
    } catch (cause) {
      setMessage('');
      setError(errorMessage(cause));
      setCode('');
    } finally { setBusy(false); }
  }

  async function resend() {
    setError(''); setMessage('');
    try {
      await useAuthStore.getState().resendVerification(email);
      setCode('');
      setMessage('A new code is on its way. Check your inbox.');
    } catch (cause) {
      setError(errorMessage(cause));
      throw cause;
    }
  }

  return <Screen>
    <Brand />
    <Heading title="Verify Your Email" subtitle={`We sent a 6-digit code to ${email || 'your email'}`} />
    <Label muted size={13}>The code expires in 1 minute. You can request a new one after 60 seconds.</Label>
    <OtpInput
      value={code}
      onChangeText={value => { setCode(value); if (error) setError(''); }}
      onComplete={submit}
      onResend={email ? resend : undefined}
      error={error}
      submitting={busy}
      disabled={!email}
    />
    {!!message && <Label size={13} style={{ color: colors.primary }}>{message}</Label>}
    <Button title="Verify & Continue" loading={busy} disabled={!email || code.length !== 6} onPress={() => submit()} />
    <Button secondary title="Use a different email" disabled={busy} onPress={() => router.replace('/login')} />
  </Screen>;
}
