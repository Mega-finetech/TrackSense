import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
export default function AppLayout() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerTitle: '', headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="(tabs)" options={{ headerShown: false }} /></Stack>;
}
