import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Brand, Button, Field, Heading, Label, Screen } from '../../components/ui';
import { OtpInput } from '../../components/OtpInput';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { errorMessage } from '../../services/errors';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = (Array.isArray(params.email) ? params.email[0] : params.email) || '';
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function validatePassword() {
    if (password.length < 8) return 'Use at least 8 characters for your new password.';
    if (password !== confirm) return 'Passwords do not match.';
    return '';
  }

  async function submit(candidate = code) {
    if (busy) return;
    if (!email) { setError('Start again from Forgot Password so we can send a recovery code.'); return; }
    if (candidate.length !== 6) { setError('Enter all 6 digits from your email.'); return; }
    const passwordError = validatePassword();
    if (passwordError) { setError(passwordError); return; }
    setBusy(true); setError('');
    try {
      await useAuthStore.getState().resetPassword(email, candidate, password);
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
      await useAuthStore.getState().requestPasswordReset(email);
      setCode('');
      setMessage('If this email is registered, a new code has been sent.');
    } catch (cause) {
      setError(errorMessage(cause));
      throw cause;
    }
  }

  return <Screen>
    <Brand />
    <Heading title="Reset Password" subtitle={`We sent a 6-digit code to ${email || 'your email'}`} />
    <Label muted size={13}>The code expires in 10 minutes. Your other devices will be signed out after the reset.</Label>
    <OtpInput
      value={code}
      onChangeText={value => { setCode(value); if (error) setError(''); }}
      onComplete={value => { if (password.length >= 8 && password === confirm) void submit(value); }}
      onResend={email ? resend : undefined}
      error={error}
      submitting={busy}
      disabled={!email}
    />
    {!!message && <Label size={13} style={{ color: colors.primary }}>{message}</Label>}
    <Field
      label="New Password"
      value={password}
      onChangeText={value => { setPassword(value); if (error) setError(''); }}
      secureTextEntry
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="new-password"
      editable={!busy}
    />
    <Field
      label="Confirm Password"
      value={confirm}
      onChangeText={value => { setConfirm(value); if (error) setError(''); }}
      secureTextEntry
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="new-password"
      editable={!busy}
    />
    <Button title="Reset Password" loading={busy} disabled={!email || code.length !== 6 || password.length < 8} onPress={() => submit()} />
    <Button secondary title="Back to sign in" disabled={busy} onPress={() => router.replace('/login')} />
  </Screen>;
}
