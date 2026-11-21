import '../src/global.css';
import { NotificationSync } from '../src/components/NotificationSync';
import { ReminderSync } from '../src/components/ReminderSync';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { queryClient } from '../src/services/query';
import { useAuthStore } from '../src/stores/authStore';
import { usePreferencesStore } from '../src/stores/preferencesStore';
import { Loading, Screen } from '../src/components/ui';
import { getSupabase, supabaseEnabled } from '../src/services/supabase';
import { authDiagnostic } from '../src/services/authDiagnostics';

SplashScreen.preventAutoHideAsync().catch(() => {});
export default function RootLayout() {
  return <SafeAreaProvider><QueryClientProvider client={queryClient}><ThemeProvider><Navigation /></ThemeProvider></QueryClientProvider></SafeAreaProvider>;
}
function Navigation() {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
  const onboarded = usePreferencesStore(state => state.onboarded);
  const { colors, dark } = useTheme();
  useEffect(() => {
    if (!isLoading && isAuthenticated) authDiagnostic(onboarded ? 'NAVIGATION_START_DASHBOARD' : 'NAVIGATION_START_ONBOARDING');
  }, [isLoading, isAuthenticated, onboarded]);
  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!supabaseEnabled) return;
    let client;
    try { client = getSupabase(); } catch { return; }
    const { data } = client.auth.onAuthStateChange((event, session) => {
      // Keep SDK callbacks synchronous; never await another Auth operation here.
      if (event === 'TOKEN_REFRESHED' && session && useAuthStore.getState().providerSubject === session.user.id) {
        useAuthStore.setState({ token: session.access_token });
      }
      if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, token: null, providerSubject: null, isAuthenticated: false });
        usePreferencesStore.getState().reset(); queryClient.clear();
      }
    });
    const update = (state: string) => { if (state === 'active') client.auth.startAutoRefresh(); else client.auth.stopAutoRefresh(); };
    update(AppState.currentState);
    const subscription = AppState.addEventListener('change', update);
    return () => { data.subscription.unsubscribe(); subscription.remove(); client.auth.stopAutoRefresh(); };
  }, []);
  useEffect(() => { if (!isLoading) SplashScreen.hideAsync().catch(() => {}); }, [isLoading]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => focusManager.setFocused(state === 'active'));
    return () => subscription.remove();
  }, []);
  if (isLoading) return <Screen><Loading /></Screen>;
  return <><ReminderSync /><NotificationSync /><StatusBar style={dark ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Protected guard={!isAuthenticated}><Stack.Screen name="(auth)" /></Stack.Protected>
    <Stack.Protected guard={isAuthenticated && !onboarded}><Stack.Screen name="onboarding" /><Stack.Screen name="onboarding-complete" /></Stack.Protected>
    <Stack.Protected guard={isAuthenticated && onboarded}><Stack.Screen name="(app)" /></Stack.Protected>
  </Stack></>;
}
