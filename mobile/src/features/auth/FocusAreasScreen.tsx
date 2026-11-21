import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Target, CheckSquare, BookOpen, Heart, Folder, Timer, Check, ChevronLeft } from 'lucide-react-native';
import { focusAreas, FocusArea, usePreferencesStore } from '../../stores/preferencesStore';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { errorMessage } from '../../services/errors';
import { requestNotificationPermissions } from '../../services/notifications';

const modules = [
  { Icon: Target, color: '#2D6A4F', background: '#DCFCE7' },
  { Icon: CheckSquare, color: '#2563EB', background: '#DBEAFE' },
  { Icon: BookOpen, color: '#7C3AED', background: '#EDE9FE' },
  { Icon: Heart, color: '#DC2626', background: '#FEE2E2' },
  { Icon: Folder, color: '#D97706', background: '#FEF3C7' },
  { Icon: Timer, color: '#0891B2', background: '#CFFAFE' },
];

export default function FocusAreasScreen() {
  const preferences = usePreferencesStore();
  const [selected, setSelected] = useState<FocusArea[]>(preferences.onboarded ? preferences.focusAreas : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { dark } = useTheme();
  const c = {
    background: dark ? '#0A0F0D' : '#FFFFFF', card: dark ? '#111915' : '#FFFFFF',
    border: dark ? '#2D4A38' : '#E5E7EB', selected: dark ? '#1A2E22' : '#F0FDF4',
    accent: dark ? '#52B788' : '#2D6A4F', primary: dark ? '#52B788' : '#1B4332',
    title: dark ? '#F0FDF4' : '#1A1A1A', subtitle: dark ? '#86EFAC' : '#6B7280',
    onPrimary: dark ? '#0A0F0D' : '#FFFFFF',
  };
  async function save() {
    if (!selected.length || saving) return;
    setSaving(true); setError('');
    try {
      if (preferences.onboarded) {
        await preferences.save(selected);
        void requestNotificationPermissions();
        router.replace('/');
      } else {
        await preferences.saveSelection(selected);
        router.push('/onboarding-complete');
      }
    }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  }
  function back() {
    if (preferences.onboarded) { router.back(); return; }
    useAuthStore.getState().logout().catch(cause => setError(errorMessage(cause)));
  }
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.background }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.navigation}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={preferences.onboarded ? 'Go back' : 'Sign out and return to welcome'} disabled={saving} onPress={back} style={styles.back}>
            <ChevronLeft size={24} color={c.title} />
          </TouchableOpacity>
          <View accessibilityLabel="Step 1 of 5" style={styles.dots}>
            {[0, 1, 2, 3, 4].map(step => <View key={step} style={[styles.dot, step === 0 && styles.activeDot, { backgroundColor: step === 0 ? c.primary : c.border }]} />)}
          </View>
        </View>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={[styles.title, { color: c.title }]}>Choose Your Focus</Text>
          <Text style={[styles.subtitle, { color: c.subtitle }]}>Select the areas you want to track.</Text>
          <Text style={[styles.subtitle, { color: c.subtitle }]}>You can always change this later.</Text>
        </View>
        <View style={styles.grid}>
          {focusAreas.map((area, index) => {
            const { Icon, color, background } = modules[index];
            const active = selected.includes(area);
            return <TouchableOpacity key={area} accessibilityRole="checkbox" accessibilityLabel={area === 'Focus' ? 'Focus Timer' : area} aria-checked={active} accessibilityState={{ checked: active, disabled: saving }} disabled={saving} activeOpacity={0.85}
              onPress={() => setSelected(current => current.includes(area) ? current.filter(value => value !== area) : [...current, area])}
              style={[styles.card, { backgroundColor: active ? c.selected : c.card, borderColor: active ? c.accent : c.border }]}>
              {active && <View style={[styles.check, { backgroundColor: c.accent }]}><Check size={12} color="#FFFFFF" /></View>}
              <View style={[styles.icon, { backgroundColor: background }]}><Icon size={24} color={color} /></View>
              <Text style={[styles.moduleName, { color: c.title }]}>{area === 'Focus' ? 'Focus Timer' : area}</Text>
            </TouchableOpacity>;
          })}
        </View>
        <Text style={[styles.note, { color: c.subtitle }]}>{'\uD83D\uDC9A'} Spiritual module is optional and private</Text>
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <View style={styles.footer}>
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !selected.length || saving, busy: saving }} disabled={!selected.length || saving} activeOpacity={0.85} onPress={save} style={[styles.button, { backgroundColor: selected.length ? c.primary : c.border }]}>
            {saving ? <ActivityIndicator color={c.onPrimary} /> : <Text style={[styles.buttonText, { color: selected.length ? c.onPrimary : '#9CA3AF' }]}>{preferences.onboarded ? 'Save preferences' : 'Continue'}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { flexGrow: 1 },
  navigation: { paddingTop: 60, paddingHorizontal: 24 },
  back: { width: 44, height: 44, justifyContent: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 }, activeDot: { width: 24 },
  heading: { marginTop: 32, paddingHorizontal: 24, marginBottom: 32 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 8 }, subtitle: { fontSize: 15, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 16 },
  card: { flexBasis: '45%', flexGrow: 1, minHeight: 110, padding: 20, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  check: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 48, height: 48, borderRadius: 12, marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
  moduleName: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  note: { marginTop: 16, paddingHorizontal: 24, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  error: { color: '#EF4444', paddingHorizontal: 24, marginTop: 16, fontSize: 14 },
  footer: { marginTop: 'auto', paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40 },
  button: { width: '100%', height: 56, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
