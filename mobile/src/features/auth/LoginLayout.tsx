import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import SocialLogo from './SocialLogo';

function usePalette() {
  const { dark } = useTheme();
  return {
    dark, background: dark ? '#0A0F0D' : '#FFFFFF',
    input: dark ? '#1A2E22' : '#F9FAFB', border: dark ? '#2D4A38' : '#E5E7EB',
    accent: dark ? '#52B788' : '#2D6A4F', primary: dark ? '#52B788' : '#1B4332',
    onPrimary: dark ? '#0A0F0D' : '#FFFFFF', heading: dark ? '#F0FDF4' : '#1A1A1A',
    secondary: dark ? '#86EFAC' : '#6B7280', icon: dark ? '#86EFAC' : '#9CA3AF',
    social: dark ? '#111915' : '#FFFFFF',
  };
}

export function LoginInput({ kind, error, onFocus, onBlur, ...props }: TextInputProps & {
  kind: 'email' | 'password'; error?: string;
}) {
  const c = usePalette();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const Icon = kind === 'email' ? Mail : Lock;
  return (
    <View style={kind === 'email' ? styles.emailGroup : styles.passwordGroup}>
      <View style={[styles.field, { backgroundColor: c.input, borderColor: focused ? c.accent : c.border }]}>
        <Icon size={20} color={c.icon} />
        <TextInput
          {...props}
          style={[styles.input, { color: c.heading }]}
          placeholderTextColor={c.icon}
          secureTextEntry={kind === 'password' && !visible}
          onFocus={event => { setFocused(true); onFocus?.(event); }}
          onBlur={event => { setFocused(false); onBlur?.(event); }}
        />
        {kind === 'password' && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible(!visible)} style={styles.eye}
          >
            {visible ? <EyeOff size={20} color={c.icon} /> : <Eye size={20} color={c.icon} />}
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </View>
  );
}

type LoginLayoutProps = {
  children: ReactNode;
  loading: boolean;
  error: string;
  onSubmit: () => void;
  onRegister: () => void;
  onRecover?: () => void;
};

export default function LoginLayout({ children, loading, error, onSubmit, onRegister, onRecover }: LoginLayoutProps) {
  const c = usePalette();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.background }]}>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={[styles.title, { color: c.heading }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: c.secondary }]}>Sign in to continue your journey.</Text>
          {!!error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.apiError}>{error}</Text>}
          {children}
          {onRecover && (
            <TouchableOpacity accessibilityRole="link" onPress={onRecover} style={styles.recover}>
              <Text style={[styles.recoverText, { color: c.accent }]}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            accessibilityRole="button" accessibilityState={{ disabled: loading, busy: loading }}
            disabled={loading} activeOpacity={0.85} onPress={onSubmit}
            style={[styles.submit, { backgroundColor: c.primary }]}
          >
            {loading ? <ActivityIndicator color={c.onPrimary} accessibilityLabel="Signing in" /> : <Text style={[styles.submitText, { color: c.onPrimary }]}>Sign In</Text>}
          </TouchableOpacity>
          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: c.border }]} />
            <Text style={[styles.dividerText, { color: c.icon }]}>or continue with</Text>
            <View style={[styles.line, { backgroundColor: c.border }]} />
          </View>
          <View style={styles.socialRow}>
            {(['Google', 'Apple'] as const).map(provider => (
              <TouchableOpacity key={provider} accessibilityRole="button"
                accessibilityLabel={`${provider} sign in unavailable`} accessibilityState={{ disabled: true }} disabled
                style={[styles.social, { backgroundColor: c.social, borderColor: c.border }]}>
                <SocialLogo provider={provider} color={c.heading} />
                <Text style={[styles.socialText, { color: c.heading }]}>{provider}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.availability, { color: c.secondary }]}>Google and Apple sign in are not available yet.</Text>
          <TouchableOpacity accessibilityRole="link" onPress={onRegister} style={styles.register}>
            <Text style={[styles.registerText, { color: c.secondary }]}>
              Don't have an account? <Text style={[styles.registerLink, { color: c.accent }]}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, paddingTop: 80, paddingHorizontal: 24, paddingBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 40 },
  emailGroup: { marginBottom: 16 }, passwordGroup: { marginBottom: 8 },
  field: { height: 56, paddingHorizontal: 16, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, minWidth: 0, height: '100%', fontSize: 15, paddingVertical: 0 },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -12 },
  error: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  apiError: { fontSize: 14, color: '#EF4444', marginBottom: 16 },
  recover: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginBottom: 32 },
  recoverText: { fontSize: 14, fontWeight: '600' },
  submit: { width: '100%', height: 56, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  submitText: { fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  line: { flex: 1, height: 1 }, dividerText: { fontSize: 14 },
  socialRow: { flexDirection: 'row', gap: 12 },
  social: { flex: 1, height: 52, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  socialText: { fontSize: 14, fontWeight: '600' }, availability: { fontSize: 11, textAlign: 'center', marginTop: 8 },
  register: { marginTop: 32, minHeight: 44, justifyContent: 'center' },
  registerText: { fontSize: 14, textAlign: 'center' }, registerLink: { fontWeight: '700' },
});
