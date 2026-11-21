import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { useTheme } from '../../theme/ThemeProvider';
import { errorMessage } from '../../services/errors';
import { requestNotificationPermissions } from '../../services/notifications';

const highlights = [
  'Track goals and milestones',
  'Manage tasks across all your modules',
  'Monitor your growth with analytics',
];

export default function OnboardingCompleteScreen() {
  const { dark } = useTheme();
  const { height } = useWindowDimensions();
  const compact = height < 780;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const c = {
    background: dark ? '#0A0F0D' : '#FFFFFF',
    title: dark ? '#F0FDF4' : '#1A1A1A',
    subtitle: dark ? '#86EFAC' : '#6B7280',
    highlight: dark ? '#D1FAE5' : '#374151',
    checkBackground: dark ? '#1A2E22' : '#DCFCE7',
    check: dark ? '#52B788' : '#2D6A4F',
    button: dark ? '#52B788' : '#1B4332',
    buttonText: dark ? '#0A0F0D' : '#FFFFFF',
  };

  async function complete() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const preferences = usePreferencesStore.getState();
      await preferences.save(preferences.focusAreas);
      void requestNotificationPermissions();
      router.replace('/');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.background }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={styles.content}>
        <View style={[styles.celebration, compact && styles.compactCelebration]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={[styles.emoji, compact && styles.compactEmoji]}>{'\uD83C\uDF89'}</Text>
          <View style={[styles.dot, styles.yellowDot]} />
          <View style={[styles.dot, styles.greenDot]} />
          <View style={[styles.dot, styles.blueDot]} />
          <View style={[styles.dot, styles.redDot]} />
        </View>
        <Text accessibilityRole="header" style={[styles.title, compact && styles.compactTitle, { color: c.title }]}>You're All Set!</Text>
        <Text style={[styles.subtitle, compact && styles.compactSubtitle, { color: c.subtitle }]}>Let's build a more intentional you.</Text>
        <View style={styles.highlights}>
          {highlights.map(label => (
            <View key={label} style={styles.row}>
              <View style={[styles.check, { backgroundColor: c.checkBackground }]}><Check size={14} color={c.check} /></View>
              <Text style={[styles.highlightText, { color: c.highlight }]}>{label}</Text>
            </View>
          ))}
        </View>
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <View style={[styles.action, compact && styles.compactAction]}>
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: saving, busy: saving }} disabled={saving} activeOpacity={0.85} onPress={complete} style={[styles.button, { backgroundColor: c.button }]}>
            {saving ? <ActivityIndicator color={c.buttonText} accessibilityLabel="Finishing setup" /> : <Text style={[styles.buttonText, { color: c.buttonText }]}>Go to Dashboard</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 24 },
  celebration: { width: '100%', height: 180 },
  emoji: { fontSize: 80, lineHeight: 100, textAlign: 'center', marginTop: 80 },
  dot: { position: 'absolute' },
  yellowDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FCD34D', top: 60, left: '25%' },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#52B788', top: 50, right: '25%' },
  blueDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#60A5FA', top: 140, left: '20%' },
  redDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#F87171', top: 130, right: '22%' },
  title: { marginTop: 48, fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, textAlign: 'center', paddingHorizontal: 40, lineHeight: 24, marginBottom: 60 },
  highlights: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 32 },
  check: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  highlightText: { flex: 1, fontSize: 15, lineHeight: 22, marginLeft: 12 },
  action: { marginTop: 48, paddingHorizontal: 24, width: '100%' },
  button: { width: '100%', height: 56, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700' },
  error: { color: '#EF4444', fontSize: 13, paddingHorizontal: 24, marginTop: 8 },
  compactCelebration: { height: 160 }, compactEmoji: { marginTop: 50 },
  compactTitle: { marginTop: 16 }, compactSubtitle: { marginBottom: 24 }, compactAction: { marginTop: 20 },
});
