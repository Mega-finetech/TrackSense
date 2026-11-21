import { useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';

function usePalette() {
  const { dark } = useTheme();
  return { dark, background: dark ? '#0A0F0D' : '#FFFFFF', input: dark ? '#1A2E22' : '#F9FAFB', border: dark ? '#2D4A38' : '#E5E7EB', primary: dark ? '#52B788' : '#1B4332', icon: dark ? '#86EFAC' : '#9CA3AF', heading: dark ? '#F0FDF4' : '#1A1A1A', secondary: dark ? '#86EFAC' : '#6B7280', social: dark ? '#111915' : '#FFFFFF', accent: dark ? '#86EFAC' : '#2D6A4F' };
}

export function RegistrationInput({ kind, error, ...props }: TextInputProps & { kind: 'name' | 'email' | 'password'; error?: string }) {
  const c = usePalette();
  const [visible, setVisible] = useState(false);
  const Icon = kind === 'name' ? User : kind === 'email' ? Mail : Lock;
  return <View style={styles.fieldGroup}>
    <View style={[styles.field, { backgroundColor: c.input, borderColor: c.border }]}>
      <Icon size={20} color={c.icon} />
      <TextInput {...props} style={[styles.input, { color: c.heading }]} placeholderTextColor={c.icon} secureTextEntry={kind === 'password' && !visible} />
      {kind === 'password' && <TouchableOpacity accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible(!visible)} style={styles.eye}>
        {visible ? <EyeOff size={20} color={c.icon} /> : <Eye size={20} color={c.icon} />}
      </TouchableOpacity>}
    </View>
    {!!error && <Text accessibilityRole="alert" style={[styles.error, { color: c.dark ? '#FFA6AD' : '#B42318' }]}>{error}</Text>}
  </View>;
}

export default function RegistrationLayout({ children, loading, signInRequired, onSubmit }: { children: ReactNode; loading: boolean; signInRequired: boolean; onSubmit: () => void }) {
  const c = usePalette();
  return <SafeAreaView style={[styles.screen, { backgroundColor: c.background }]}>
    <StatusBar style={c.dark ? 'light' : 'dark'} />
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to splash" onPress={() => router.replace('/welcome')} style={styles.back}>
          <ArrowLeft size={24} color={c.heading} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={[styles.title, { color: c.heading }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: c.secondary }]}>Start your journey to a more intentional life.</Text>
        {children}
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: loading, busy: loading }} disabled={loading} activeOpacity={0.85} onPress={onSubmit} style={[styles.submit, { backgroundColor: c.primary }]}>
          {loading ? <ActivityIndicator color="#FFFFFF" accessibilityLabel="Creating account" /> : <Text style={styles.submitText}>{signInRequired ? 'Continue to sign in' : 'Create Account'}</Text>}
        </TouchableOpacity>
        <View style={styles.divider}><View style={[styles.line, { backgroundColor: c.border }]} /><Text style={[styles.dividerText, { color: c.icon }]}>or continue with</Text><View style={[styles.line, { backgroundColor: c.border }]} /></View>
        <View style={styles.socialRow}>
          {(['Google', 'Apple'] as const).map(provider => <TouchableOpacity key={provider} accessibilityRole="button" accessibilityLabel={`${provider} sign up unavailable`} accessibilityState={{ disabled: true }} disabled style={[styles.social, { backgroundColor: c.social, borderColor: c.border }]}>
            <Svg width={20} height={20} viewBox="0 0 24 24" accessible={false}>
              {provider === 'Google' ? <>
                <Path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
                <Path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.97-3.38.97-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z" />
                <Path fill="#FBBC05" d="M6.4 13.93A6 6 0 0 1 6.08 12c0-.67.12-1.32.32-1.93V7.48H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.52Z" />
                <Path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.34 2.59C7.19 7.71 9.4 5.95 12 5.95Z" />
              </> : <Path fill={c.heading} d="M17.05 12.54c.03 3.25 2.85 4.33 2.88 4.34-.02.08-.45 1.54-1.49 3.05-.9 1.3-1.83 2.6-3.3 2.63-1.44.03-1.9-.85-3.55-.85-1.64 0-2.16.82-3.52.88-1.42.05-2.5-1.41-3.41-2.71-1.86-2.67-3.28-7.55-1.37-10.85a5.3 5.3 0 0 1 4.49-2.72c1.4-.03 2.73.94 3.59.94.85 0 2.45-1.16 4.13-.99.7.03 2.67.28 3.94 2.14-.1.06-2.36 1.37-2.39 4.14ZM14.34 4.47c.76-.92 1.28-2.2 1.14-3.47-1.1.04-2.44.73-3.23 1.65-.7.81-1.32 2.1-1.15 3.34 1.23.1 2.48-.62 3.24-1.52Z" />}
            </Svg><Text style={[styles.socialText, { color: c.heading }]}>{provider}</Text>
          </TouchableOpacity>)}
        </View>
        <Text style={[styles.availability, { color: c.secondary }]}>Google and Apple sign up are not available yet.</Text>
        <Text style={[styles.terms, { color: c.secondary }]}>By creating an account, you agree to our{'\n'}<Text style={[styles.legalLink, { color: c.accent }]}>Terms of Service</Text> and <Text style={[styles.legalLink, { color: c.accent }]}>Privacy Policy</Text></Text>
        <Text style={[styles.availability, { color: c.secondary }]}>Policy links are not available yet.</Text>
        <TouchableOpacity accessibilityRole="link" onPress={() => router.replace('/login')} style={styles.signIn}><Text style={[styles.signInText, { color: c.secondary }]}>Already have an account? <Text style={[styles.signInLink, { color: c.accent }]}>Sign in</Text></Text></TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { flexGrow: 1, paddingTop: 16, paddingHorizontal: 24, paddingBottom: 16 },
  back: { width: 44, height: 44, justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 }, subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  fieldGroup: { marginBottom: 12 }, field: { height: 56, paddingHorizontal: 16, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, minWidth: 0, height: '100%', fontSize: 15, paddingVertical: 0 }, eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -12 },
  error: { fontSize: 12, marginTop: 6 }, submit: { width: '100%', height: 56, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16 }, submitText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }, line: { flex: 1, height: 1 }, dividerText: { fontSize: 14 },
  socialRow: { flexDirection: 'row', gap: 12 }, social: { flex: 1, height: 52, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, socialText: { fontSize: 14 },
  availability: { fontSize: 11, textAlign: 'center', marginTop: 8 }, terms: { fontSize: 12, lineHeight: 20, textAlign: 'center', marginTop: 16 }, legalLink: { textDecorationLine: 'underline' },
  signIn: { marginTop: 16, minHeight: 44, justifyContent: 'center' }, signInText: { fontSize: 14, textAlign: 'center' }, signInLink: { fontWeight: '700' },
});
