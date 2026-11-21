import { useState } from 'react';
import { router } from 'expo-router';
import { Brand, Button, Field, Heading, Label, Screen } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { errorMessage } from '../../services/errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) { setError('Enter a valid email address.'); return; }
    setBusy(true); setError('');
    try {
      // The server always returns the same response, so this screen never
      // reveals whether the email is registered.
      await useAuthStore.getState().requestPasswordReset(value);
      router.push({ pathname: '/reset-password', params: { email: value } });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally { setBusy(false); }
  }

  return <Screen>
    <Brand />
    <Heading title="Forgot Password" subtitle="Enter your account email and we'll send a 10-minute recovery code." />
    <Field
      label="Email address"
      value={email}
      onChangeText={value => { setEmail(value); if (error) setError(''); }}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="email"
      editable={!busy}
      error={error}
    />
    <Label muted size={12}>For your security, we'll show the same confirmation whether or not this email has an account.</Label>
    <Button title="Send Recovery Code" loading={busy} onPress={submit} />
    <Button secondary title="Back to sign in" disabled={busy} onPress={() => router.replace('/login')} />
  </Screen>;
}
