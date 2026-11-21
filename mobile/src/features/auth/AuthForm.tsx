import LoginLayout, { LoginInput } from './LoginLayout';
import RegistrationLayout, { RegistrationInput } from './RegistrationLayout';
import { useState } from 'react';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Brand, Button, Field, Heading, Notice, Screen } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { EmailNotVerifiedError } from '../../services/auth';
import { errorMessage } from '../../services/errors';
import { supabaseEnabled } from '../../services/supabase';
import { authDiagnostic } from '../../services/authDiagnostics';
import { ProfileSetupError } from '../../services/postAuth';

export default function AuthForm({ register = false }: { register?: boolean }) {
  const schema = z.object({
    name: register ? z.string().trim().min(2, 'Enter your name').max(100) : z.string(),
    email: z.string().trim().pipe(z.email('Enter a valid email address')),
    password: z.string().min(8, 'Use at least 8 characters').max(72, 'Use at most 72 characters'),
  });
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', password: '' } });
  const [error, setError] = useState('');
  const [needsLink, setNeedsLink] = useState(false);
  const [legacyPassword, setLegacyPassword] = useState('');
  const [working, setWorking] = useState(false);
  const [signInRequired, setSignInRequired] = useState(false);
  function showError(cause: unknown) {
    authDiagnostic('AUTH_FORM_FAILED', cause);
    const message = errorMessage(cause); setError(message);
    if (register && (cause instanceof ProfileSetupError || message.toLowerCase().includes('already'))) setSignInRequired(true);
    if (supabaseEnabled && message.includes('current password')) setNeedsLink(true);
  }
  const submit = handleSubmit(async values => {
    if (signInRequired) { router.replace('/login'); return; }
    setError('');
    try {
      const auth = useAuthStore.getState();
      if (register) {
        const result = await auth.register(values.name.trim(), values.email.trim(), values.password);
        // The account exists and is waiting for its email code. The session is
        // only issued after the server marks the account verified.
        if (result.verificationRequired) {
          router.push({ pathname: '/verify-email', params: { email: result.email } });
        }
        return;
      }
      try {
        await auth.login(values.email.trim(), values.password);
      } catch (cause) {
        if (cause instanceof EmailNotVerifiedError) {
          router.push({ pathname: '/verify-email', params: { email: cause.email } });
          return;
        }
        throw cause;
      }
    } catch (cause) { showError(cause); }
  });
  if (needsLink) return <Screen><Brand /><Heading title="Keep your progress." subtitle="Enter your existing TrackSense password to securely connect your account." />
    <Field label="Existing TrackSense password" secureTextEntry value={legacyPassword} onChangeText={setLegacyPassword} />
    {!!error && <Notice message={error} />}
    <Button title="Link existing account" loading={working} onPress={async () => {
      setWorking(true); setError('');
      try { await useAuthStore.getState().linkAccount(legacyPassword); }
      catch (cause) { showError(cause); } finally { setWorking(false); }
    }} /><Button secondary title="Back to sign in" disabled={working} onPress={() => { setNeedsLink(false); setError(''); router.replace('/login'); }} />
  </Screen>;
  if (register) return <RegistrationLayout loading={isSubmitting} signInRequired={signInRequired} onSubmit={signInRequired ? () => router.replace('/login') : submit}>
    {!!error && <Notice message={error} />}
    <Controller control={control} name="name" render={({ field }) => <RegistrationInput kind="name" accessibilityLabel="Full name" placeholder="Full Name" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} autoComplete="name" keyboardType="default" autoCapitalize="words" error={errors.name?.message} editable={!isSubmitting} />} />
    <Controller control={control} name="email" render={({ field }) => <RegistrationInput kind="email" accessibilityLabel="Email address" placeholder="Email Address" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" error={errors.email?.message} editable={!isSubmitting} />} />
    <Controller control={control} name="password" render={({ field }) => <RegistrationInput kind="password" accessibilityLabel="Password" placeholder="Password" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" error={errors.password?.message} onSubmitEditing={submit} editable={!isSubmitting} />} />
  </RegistrationLayout>;
  return <LoginLayout loading={isSubmitting} error={error} onSubmit={submit} onRegister={() => router.replace('/register')} onRecover={() => router.push('/forgot-password')}>
    <Controller control={control} name="email" render={({ field }) => <LoginInput kind="email" accessibilityLabel="Email address" placeholder="Email Address" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email?.message} />} />
    <Controller control={control} name="password" render={({ field }) => <LoginInput kind="password" accessibilityLabel="Password" placeholder="Password" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} autoComplete="current-password" error={errors.password?.message} onSubmitEditing={submit} />} />
  </LoginLayout>;
}
