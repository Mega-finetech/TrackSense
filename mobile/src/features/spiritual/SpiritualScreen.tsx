import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, ChevronLeft, Flame, Heart, Lock, PenLine, Plus, Sun, Users, X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { errorMessage } from '../../services/errors';
import type { BibleStudyEntry, BibleStudyPlan, JournalEntry, SpiritualLog, Streak } from '../../types';

type Tab = 'Overview' | 'Journal';
type Activity = 'Bible Reading' | 'Prayer' | 'Devotion' | 'Reflection' | 'Fellowship';
const activities = [
  { name: 'Bible Reading', Icon: BookOpen, color: '#2D6A4F', background: '#DCFCE7' },
  { name: 'Prayer', Icon: Heart, color: '#DC2626', background: '#FEE2E2' },
  { name: 'Devotion', Icon: Sun, color: '#D97706', background: '#FEF3C7' },
  { name: 'Reflection', Icon: PenLine, color: '#7C3AED', background: '#EDE9FE' },
  { name: 'Fellowship', Icon: Users, color: '#2563EB', background: '#DBEAFE' },
] as const;
const scriptures = [
  { quote: 'Be still, and know that I am God.', ref: 'Psalm 46:10' },
  { quote: 'I can do all things through Christ who strengthens me.', ref: 'Philippians 4:13' },
  { quote: 'Trust in the Lord with all your heart.', ref: 'Proverbs 3:5' },
  { quote: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' },
  { quote: 'For I know the plans I have for you.', ref: 'Jeremiah 29:11' },
  { quote: 'Cast all your anxiety on him because he cares for you.', ref: '1 Peter 5:7' },
  { quote: 'Be strong and courageous. Do not be afraid.', ref: 'Joshua 1:9' },
];
// These are the moods accepted by the current journal API.
const moods = [{ value: '\u{1F60A}', label: 'Happy' }, { value: '\u{1F60C}', label: 'Peaceful' }, { value: '\u{1F64F}', label: 'Grateful' }, { value: '\u{1F49B}', label: 'Loved' }, { value: '\u{1F33F}', label: 'Growing' }];
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dayPart = (date: string) => date.slice(0, 10);
const readableDate = (date: string) => new Date(`${dayPart(date)}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export default function SpiritualScreen({ initialTab = 'Overview' }: { initialTab?: Tab }) {
  const { dark } = useTheme(); const insets = useSafeAreaInsets();
  const c = { background: dark ? '#0A0F0D' : '#F8F9FA', card: dark ? '#111915' : '#FFFFFF', border: dark ? '#2D4A38' : '#E5E7EB', primary: dark ? '#52B788' : '#1B4332', onPrimary: dark ? '#0A0F0D' : '#FFFFFF', text: dark ? '#F0FDF4' : '#1A1A1A', secondary: dark ? '#86EFAC' : '#6B7280', muted: dark ? '#92AB9C' : '#6B7280', soft: dark ? '#1A2E22' : '#F3F4F6', quote: dark ? '#1A2E22' : '#F0FDF4', accent: dark ? '#52B788' : '#2D6A4F' };
  const [tab, setTab] = useState<Tab>(initialTab);
  const [logging, setLogging] = useState(false);
  const [activity, setActivity] = useState<Activity>('Devotion');
  const [date, setDate] = useState(dateKey(new Date()));
  const [notes, setNotes] = useState(''); const [title, setTitle] = useState('');
  const [mood, setMood] = useState(''); const [tags, setTags] = useState('');
  const [completed, setCompleted] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const userId = useAuthStore(state => state.user?.id); const client = useQueryClient();
  const today = dateKey(new Date()); const monday = new Date(); monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const start = dateKey(monday);
  const queryKey = ['spiritual', userId];
  const prayer = useQuery({ queryKey: [...queryKey, 'prayer', start, today], enabled: !!userId, queryFn: () => api.get<unknown, SpiritualLog[]>(`/spiritual/prayer?start=${start}&end=${today}`) });
  const devotion = useQuery({ queryKey: [...queryKey, 'devotion', start, today], enabled: !!userId, queryFn: () => api.get<unknown, SpiritualLog[]>(`/spiritual/devotion?start=${start}&end=${today}`) });
  const journal = useQuery({ queryKey: [...queryKey, 'journal'], enabled: !!userId, queryFn: () => api.get<unknown, JournalEntry[]>('/spiritual/journal') });
  const streaks = useQuery({ queryKey: [...queryKey, 'streaks'], enabled: !!userId, queryFn: () => api.get<unknown, Streak[]>('/streaks') });
  const bible = useQuery({ queryKey: [...queryKey, 'bible'], enabled: !!userId, queryFn: async () => {
    const plans = await api.get<unknown, BibleStudyPlan[]>('/bible-plans');
    return (await Promise.all(plans.map(plan => api.get<unknown, BibleStudyEntry[]>(`/bible-plans/${plan.id}/entries`)))).flat();
  } });
  const selectedDevotion = useQuery({ queryKey: [...queryKey, 'devotion-date', date], enabled: !!userId && logging && activity === 'Devotion' && /^\d{4}-\d{2}-\d{2}$/.test(date), refetchOnWindowFocus: false, queryFn: () => api.get<unknown, SpiritualLog[]>(`/spiritual/devotion?start=${date}&end=${date}`) });
  useEffect(() => {
    if (logging && activity === 'Devotion' && selectedDevotion.data) setNotes(selectedDevotion.data[0]?.notes || '');
  }, [logging, activity, date, selectedDevotion.data]);
  const countDays = (days: string[]) => new Set(days.map(dayPart).filter(day => day >= start && day <= today)).size;
  const counts: Record<Activity, number | null> = {
    'Bible Reading': bible.data ? countDays(bible.data.filter(item => !!item.completed).map(item => item.day_date)) : null,
    Prayer: prayer.data ? countDays(prayer.data.filter(item => Object.values(item.details || {}).some(Boolean)).map(item => item.log_date)) : null,
    Devotion: devotion.data ? countDays(devotion.data.map(item => item.log_date)) : null,
    Reflection: journal.data ? countDays(journal.data.map(item => item.entry_date)) : null,
    Fellowship: null,
  };
  const overviewQueries = [prayer, devotion, journal, bible];
  const loading = overviewQueries.some(query => query.isPending);
  const overviewError = overviewQueries.some(query => query.isError);
  const empty = !loading && !overviewError && Object.values(counts).every(count => !count);
  const prayerStreak = streaks.data?.find(item => item.type === 'prayer');
  const scripture = scriptures[new Date().getDay()];
  const supported = activity === 'Devotion' || activity === 'Reflection';
  const save = useMutation({ mutationFn: async () => {
    const parsed = new Date(`${date}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date > today) throw new Error('Choose a valid date, today or earlier (YYYY-MM-DD).');
    if (activity === 'Reflection') {
      if (!notes.trim()) throw new Error('Write your reflection before saving.');
      return api.post('/spiritual/journal', { entry_date: date, title: title.trim() || null, body: notes.trim(), mood: mood || null, tags: tags.split(',').map(tag => tag.trim()).filter(Boolean) });
    }
    if (activity !== 'Devotion' || !completed) throw new Error('Only completed devotions can be saved here.');
    // The existing endpoint upserts one devotion per day and updates its streak server-side.
    return api.post('/spiritual/devotion', { log_date: date, notes });
  }, onSuccess: async () => { await client.invalidateQueries({ queryKey }); setLogging(false); if (activity === 'Reflection') setTab('Journal'); } });
  const openLog = (type: Activity = 'Devotion') => {
    setActivity(type); setDate(today); setNotes(type === 'Devotion' ? devotion.data?.find(item => dayPart(item.log_date) === today)?.notes || '' : '');
    setTitle(''); setMood(''); setTags(''); setCompleted(true); save.reset(); setLogging(true);
  };
  const cardStyle = { backgroundColor: c.card, borderColor: c.border };
  const button = (label: string, action: () => void, disabled = false) => <Pressable accessibilityRole="button" disabled={disabled} onPress={action} style={[styles.button, { backgroundColor: c.primary, opacity: disabled ? 0.5 : 1 }]}><Text style={[styles.buttonText, { color: c.onPrimary }]}>{label}</Text></Pressable>;
  const privacy = <View style={styles.privacy}><Lock size={12} color={c.muted} /><Text style={[styles.privacyText, { color: c.muted }]}>Your spiritual data is private to your account.</Text></View>;
  const inputStyle = [styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.border }];

  return <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.screen, { backgroundColor: c.background }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <View style={[styles.header, { paddingTop: Math.max(56, insets.top) }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.headerHit}><ChevronLeft size={24} color={c.text} /></Pressable>
      <Text style={[styles.heading, { color: c.text }]}>Spiritual</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={tab === 'Journal' ? 'New reflection' : 'Log activity'} onPress={() => openLog(tab === 'Journal' ? 'Reflection' : 'Devotion')} style={styles.headerHit}><View style={[styles.plus, { backgroundColor: c.primary }]}><Plus size={18} color={c.onPrimary} /></View></Pressable>
    </View>
    <View style={styles.tabs}>{(['Overview', 'Journal'] as const).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: tab === value }} onPress={() => setTab(value)} style={[styles.tab, { backgroundColor: tab === value ? c.primary : c.soft }]}><Text style={[styles.tabText, { color: tab === value ? c.onPrimary : c.secondary, fontWeight: tab === value ? '700' : '500' }]}>{value}</Text></Pressable>)}</View>
    {tab === 'Overview' ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: c.secondary }]}>This Week</Text>
      {loading && <ActivityIndicator accessibilityLabel="Loading spiritual activities" color={c.primary} style={styles.loader} />}
      {overviewError && <View style={styles.notice}><Text accessibilityRole="alert" style={{ color: c.secondary }}>Some activities could not be loaded.</Text>{button('Retry activities', () => { overviewQueries.forEach(query => { void query.refetch(); }); })}</View>}
      {empty ? <View style={styles.empty}><Heart size={48} color={dark ? '#4B6E58' : '#D1D5DB'} /><Text style={[styles.emptyTitle, { color: c.text }]}>No activities this week</Text><Text style={[styles.body, { color: c.secondary }]}>Start tracking your spiritual journey</Text>{button('Log Activity', () => openLog())}</View> : !loading && activities.map(({ name, Icon, color, background }) => <Pressable accessibilityRole="button" accessibilityLabel={`${name}: ${counts[name] === null ? 'unavailable' : `${counts[name]} of 7 days`}`} key={name} onPress={() => name === 'Reflection' ? setTab('Journal') : openLog(name)} style={[styles.activityCard, cardStyle]}>
        <View style={[styles.activityIcon, { backgroundColor: background }]}><Icon size={18} color={color} /></View>
        <View style={styles.flex}><Text style={[styles.activityName, { color: c.text }]}>{name}</Text><View style={[styles.track, { backgroundColor: c.soft }]}><View style={[styles.fill, { backgroundColor: color, width: `${(counts[name] || 0) / 7 * 100}%` }]} /></View></View>
        <Text style={[styles.count, { color: dark ? c.primary : color }]}>{counts[name] === null ? '\u2014' : `${counts[name]}/7`}</Text>
      </Pressable>)}
      {!empty && !loading && <Text style={[styles.caption, { color: c.muted }]}>Days logged this week. Fellowship tracking is not available yet.</Text>}
      <View style={[styles.streak, { backgroundColor: dark ? c.soft : '#1B4332' }]}><Flame size={32} color="#52B788" /><View style={styles.flex}><Text style={styles.streakLabel}>CURRENT PRAYER STREAK</Text><Text style={[styles.streakCount, { color: dark ? '#52B788' : '#FFFFFF' }]}>{streaks.isSuccess ? prayerStreak?.current_count ?? 0 : '\u2014'} days</Text></View><Text style={styles.best}>Best: {streaks.isSuccess ? prayerStreak?.longest_count ?? 0 : '\u2014'} days</Text></View>
      {streaks.isError && button('Retry streak', () => { void streaks.refetch(); })}
      <View style={[styles.scripture, { backgroundColor: c.quote, borderLeftColor: c.accent }]}><Text style={[styles.quote, { color: dark ? '#D1FAE5' : '#374151' }]}>{`"${scripture.quote}"`}</Text><Text style={[styles.reference, { color: c.secondary }]}>{'\u2014 '}{scripture.ref}</Text></View>
      {privacy}
    </ScrollView> : <FlatList data={journal.data || []} keyExtractor={item => item.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
      ListHeaderComponent={<View style={styles.journalHeader}>{button('New Reflection', () => openLog('Reflection'))}{journal.isPending && <ActivityIndicator color={c.primary} />}{journal.isError && <View style={styles.notice}><Text accessibilityRole="alert" style={{ color: c.secondary }}>Your reflections could not be loaded.</Text>{button('Retry journal', () => { void journal.refetch(); })}</View>}</View>}
      ListEmptyComponent={!journal.isPending && !journal.isError ? <View style={styles.empty}><BookOpen size={48} color={dark ? '#4B6E58' : '#D1D5DB'} /><Text style={[styles.emptyTitle, { color: c.text }]}>No reflections yet</Text><Text style={[styles.body, { color: c.secondary }]}>Write your first reflection</Text>{button('New Entry', () => openLog('Reflection'))}</View> : null}
      renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={item.title || `Reflection on ${readableDate(item.entry_date)}`} onPress={() => setSelectedEntry(item)} style={[styles.journalCard, cardStyle]}>
        <View style={styles.rowBetween}><Text style={[styles.date, { color: c.muted }]}>{readableDate(item.entry_date)}</Text><Text style={styles.mood}>{item.mood || ''}</Text></View>
        {!!item.title && <Text style={[styles.entryTitle, { color: c.text }]}>{item.title}</Text>}<Text numberOfLines={2} style={[styles.preview, { color: c.secondary }]}>{item.body}</Text>
        {!!item.tags?.length && <View style={styles.tags}>{item.tags.map((tag, index) => <Text key={`${tag}-${index}`} style={[styles.tag, { backgroundColor: c.quote, color: c.accent }]}>{tag}</Text>)}</View>}
      </Pressable>} ListFooterComponent={privacy} />}
    <Modal visible={logging} transparent animationType="slide" onRequestClose={() => { if (!save.isPending) setLogging(false); }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.scrim}><SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: c.background }]}><ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.rowBetween}><Text style={[styles.heading, { color: c.text }]}>{activity === 'Reflection' ? 'New Reflection' : 'Log Activity'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close activity form" disabled={save.isPending} onPress={() => setLogging(false)} style={styles.headerHit}><X size={22} color={c.text} /></Pressable></View>
        <View style={styles.activityChoices}>{activities.map(({ name }) => <Pressable key={name} accessibilityRole="radio" accessibilityState={{ checked: activity === name }} disabled={save.isPending} onPress={() => { setActivity(name); setNotes(name === 'Devotion' ? devotion.data?.find(item => dayPart(item.log_date) === date)?.notes || '' : ''); save.reset(); }} style={[styles.choice, { backgroundColor: activity === name ? c.primary : c.soft }]}><Text style={{ color: activity === name ? c.onPrimary : c.secondary }}>{name}</Text></Pressable>)}</View>
        {supported ? <>
          <Text style={[styles.fieldLabel, { color: c.secondary }]}>Date (YYYY-MM-DD)</Text><TextInput accessibilityLabel="Activity date" value={date} onChangeText={value => { setDate(value); if (activity === 'Devotion') setNotes(devotion.data?.find(item => dayPart(item.log_date) === value)?.notes || ''); }} editable={!save.isPending} autoCapitalize="none" style={inputStyle} />
          {activity === 'Reflection' && <><Text style={[styles.fieldLabel, { color: c.secondary }]}>Title (optional)</Text><TextInput accessibilityLabel="Reflection title" value={title} onChangeText={setTitle} editable={!save.isPending} style={inputStyle} /></>}
          <Text style={[styles.fieldLabel, { color: c.secondary }]}>{activity === 'Reflection' ? 'Your reflection' : 'Notes (optional)'}</Text><TextInput accessibilityLabel="Reflection notes" multiline value={notes} onChangeText={setNotes} editable={!save.isPending && (activity !== 'Devotion' || selectedDevotion.isSuccess)} style={[...inputStyle, styles.textarea]} placeholder="Write your reflection..." placeholderTextColor={c.muted} />
          {activity === 'Reflection' ? <><View style={styles.activityChoices}>{moods.map(item => <Pressable key={item.value} accessibilityRole="radio" accessibilityLabel={item.label} accessibilityState={{ checked: mood === item.value }} disabled={save.isPending} onPress={() => setMood(mood === item.value ? '' : item.value)} style={[styles.choice, { backgroundColor: mood === item.value ? c.primary : c.soft }]}><Text style={{ color: mood === item.value ? c.onPrimary : c.secondary }}>{item.value} {item.label}</Text></Pressable>)}</View><Text style={[styles.fieldLabel, { color: c.secondary }]}>Tags (comma separated)</Text><TextInput accessibilityLabel="Reflection tags" value={tags} onChangeText={setTags} editable={!save.isPending} style={inputStyle} /></> : <><View style={styles.rowBetween}><Text style={[styles.body, { color: c.text }]}>Completed</Text><Switch accessibilityLabel="Devotion completed" value={completed} onValueChange={setCompleted} disabled={save.isPending} trackColor={{ true: '#52B788', false: c.border }} /></View><Text style={[styles.caption, { color: c.secondary }]}>Saving logs a completed devotion. Saving the same date updates its notes.</Text></>}
          {activity === 'Devotion' && selectedDevotion.isPending && <ActivityIndicator accessibilityLabel="Loading saved devotion" color={c.primary} />}
          {activity === 'Devotion' && selectedDevotion.isError && <View><Text accessibilityRole="alert" style={styles.error}>Could not load this date's saved notes.</Text>{button('Retry saved notes', () => { void selectedDevotion.refetch(); })}</View>}
          {save.isError && <Text accessibilityRole="alert" style={styles.error}>{errorMessage(save.error)}</Text>}
          {button(save.isPending ? 'Saving...' : activity === 'Reflection' ? 'Save Reflection' : 'Log Activity', () => save.mutate(), save.isPending || (activity === 'Devotion' && (!completed || !selectedDevotion.isSuccess)))}
        </> : <View style={styles.notice}><Text style={[styles.body, { color: c.secondary }]}>{activity === 'Fellowship' ? 'Fellowship logging is not available yet.' : `Use the existing ${activity === 'Prayer' ? 'Prayer Tracker' : 'Bible Study'} screen for this activity.`}</Text>{activity !== 'Fellowship' && button(activity === 'Prayer' ? 'Open Prayer Tracker' : 'Open Bible Study', () => { setLogging(false); router.push(activity === 'Prayer' ? '/spiritual/prayer' : '/spiritual/bible'); })}</View>}
      </ScrollView></SafeAreaView></KeyboardAvoidingView>
    </Modal>
    <Modal visible={!!selectedEntry} transparent animationType="slide" onRequestClose={() => setSelectedEntry(null)}><View style={styles.scrim}><SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: c.background }]}><View style={styles.rowBetween}><Text style={[styles.heading, { color: c.text }]}>Reflection</Text><Pressable accessibilityRole="button" accessibilityLabel="Close reflection" onPress={() => setSelectedEntry(null)} style={styles.headerHit}><X size={22} color={c.text} /></Pressable></View><ScrollView><Text style={[styles.date, { color: c.muted }]}>{selectedEntry ? readableDate(selectedEntry.entry_date) : ''} {selectedEntry?.mood}</Text><Text style={[styles.detailTitle, { color: c.text }]}>{selectedEntry?.title}</Text><Text style={[styles.detailBody, { color: c.secondary }]}>{selectedEntry?.body}</Text><View style={styles.tags}>{selectedEntry?.tags?.map((tag, index) => <Text key={`${tag}-${index}`} style={[styles.tag, { backgroundColor: c.quote, color: c.accent }]}>{tag}</Text>)}</View></ScrollView></SafeAreaView></View></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, flex: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerHit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 20, fontWeight: '700' }, plus: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 16, paddingHorizontal: 20 },
  tab: { paddingHorizontal: 24, paddingVertical: 8, minHeight: 40, borderRadius: 20, justifyContent: 'center' }, tabText: { fontSize: 14 },
  content: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 },
  activityCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, shadowColor: '#000000', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  activityIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activityName: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' }, fill: { height: 5, borderRadius: 3 }, count: { fontSize: 13, fontWeight: '700', marginLeft: 14, minWidth: 28, textAlign: 'right' },
  caption: { fontSize: 11, lineHeight: 17, marginBottom: 10 },
  streak: { marginTop: 20, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  streakLabel: { fontSize: 10, letterSpacing: 0.5, color: '#90EE90', fontWeight: '600' }, streakCount: { fontSize: 28, fontWeight: '800', marginTop: 2 }, best: { fontSize: 12, color: '#90EE90', maxWidth: 65 },
  scripture: { marginTop: 20, borderRadius: 16, padding: 20, borderLeftWidth: 4 },
  quote: { fontSize: 14, fontStyle: 'italic', lineHeight: 22, marginBottom: 8 }, reference: { fontSize: 12, fontWeight: '600' },
  privacy: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16 }, privacyText: { fontSize: 11, textAlign: 'center', flexShrink: 1 },
  journalHeader: { marginBottom: 16 }, journalCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  date: { fontSize: 12, fontWeight: '500' }, mood: { fontSize: 16 }, entryTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 }, preview: { fontSize: 13, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }, tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, fontSize: 11, fontWeight: '500' },
  button: { width: '100%', minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 8 }, buttonText: { fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 10 }, emptyTitle: { fontSize: 18, fontWeight: '700' }, body: { fontSize: 14, lineHeight: 22 }, loader: { marginVertical: 24 }, notice: { gap: 12, paddingVertical: 16 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }, sheet: { maxHeight: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  activityChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 }, choice: { paddingHorizontal: 12, minHeight: 44, borderRadius: 20, justifyContent: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 10 }, input: { borderRadius: 12, borderWidth: 1, padding: 12, minHeight: 48, fontSize: 14 }, textarea: { minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
  error: { color: '#EF4444', fontSize: 13, marginVertical: 8 }, detailTitle: { fontSize: 22, fontWeight: '700', marginVertical: 12 }, detailBody: { fontSize: 15, lineHeight: 24 },
});
