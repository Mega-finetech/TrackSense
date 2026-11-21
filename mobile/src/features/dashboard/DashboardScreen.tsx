import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Circle } from 'react-native-svg';
import { BookOpen, CalendarDays, ClipboardList, Flame, Folder, Heart, Plus, SquarePen, Target, Timer, X } from 'lucide-react-native';
import { Notice, Progress } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { FidelityTheme, useTheme } from '../../theme/ThemeProvider';
import api from '../../services/api';
import { errorMessage } from '../../services/errors';
import { Task } from '../../types';
import { useUpdateTask } from '../tasks/queries';

type Summary = { activeGoals: number; totalTodayTasks: number; completedTodayTasks: number; focusMinutesToday: number; studyHoursThisWeek: number; prayerStreak?: number; upcomingTasks: Task[]; goalsProgress: { id: string; title: string; progress: number; category?: string }[] };
type ProjectPreview = { id: string; title: string; status: string; progress: number };
const modules = [{ name: 'Goals', route: '/goals', Icon: Target }, { name: 'Study', route: '/courses', Icon: BookOpen }, { name: 'Projects', route: '/projects', Icon: Folder }, { name: 'Spiritual', route: '/spiritual', Icon: Heart }];

function formatDue(value?: string | null) {
  if (!value) return 'No due date';
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return 'No due date';
  const time = due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (due.toDateString() === new Date().toDateString()) return `Due today, ${time}`;
  return `Due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`;
}

function Skeleton({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true })]));
    animation.start(); return () => animation.stop();
  }, [opacity]);
  return <Animated.View accessibilityLabel="Loading" style={[styles.skeleton, { backgroundColor: color, opacity }]} />;
}

export default function DashboardScreen() { return <FidelityTheme><DashboardContent /></FidelityTheme>; }

function DashboardContent() {
  const user = useAuthStore(state => state.user);
  const areas = usePreferencesStore(state => state.focusAreas);
  const { dark } = useTheme(); const update = useUpdateTask();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const summary = useQuery({ queryKey: ['dashboard', user?.id, timezone], queryFn: async () => {
    const response = await api.get<unknown, { data: Summary }>('/dashboard/summary', { params: { timezone } });
    return response.data;
  } });
  const projects = useQuery({ queryKey: ['projects', user?.id, ''], enabled: !!user, queryFn: () => api.get<unknown, ProjectPreview[]>('/projects') });
  const [quickAdd, setQuickAdd] = useState(false);
  const c = {
    background: dark ? '#0A0F0D' : '#FFFFFF',
    card: dark ? '#111915' : '#FFFFFF',
    border: dark ? '#263A2E' : '#E8EAED',
    primary: dark ? '#52B788' : '#14532D',
    onPrimary: dark ? '#0A0F0D' : '#FFFFFF',
    text: dark ? '#F0FDF4' : '#111827',
    secondary: dark ? '#9DB8A8' : '#6B7280',
    muted: dark ? '#5E7A69' : '#9CA3AF',
    track: dark ? '#22352A' : '#F0F2F1',
    accent: dark ? '#6BCD95' : '#14532D',
    projectTint: dark ? 'rgba(82, 183, 136, 0.14)' : '#E9F7EF',
    ring: dark ? '#6BCD95' : '#22C55E',
    link: dark ? '#93C5FD' : '#2563EB',
    upcomingTint: dark ? '#232A45' : '#E0E7FF',
    upcomingIcon: dark ? '#A5B4FC' : '#4F46E5',
  };
  const data = summary.data;
  const today = new Date(); const hour = today.getHours();
  const week = Array.from({ length: 7 }, (_, index) => { const date = new Date(today); date.setDate(today.getDate() - (today.getDay() + 6) % 7 + index); return date; });
  const upcoming = [...(data?.upcomingTasks || [])].sort((a, b) => (a.due_date ? new Date(a.due_date).getTime() : Infinity) - (b.due_date ? new Date(b.due_date).getTime() : Infinity));
  const nextTask = upcoming[0];
  const todayFocus = upcoming.find(task => task.status !== 'done');
  const ratio = data?.totalTodayTasks ? Math.max(0, Math.min(1, data.completedTodayTasks / data.totalTodayTasks)) : 0;
  const circumference = 2 * Math.PI * 46;
  const cardStyle = { backgroundColor: c.card, borderColor: c.border };
  const activeProjects = (projects.data || []).filter(project => project.status !== 'completed');
  const goals = data?.goalsProgress || [];
  const visibleModules = modules.filter(module => areas.includes(module.name as typeof areas[number]));
  const actions = [
    { label: 'Add Task', Icon: CalendarDays, color: dark ? '#93C5FD' : '#2563EB', background: dark ? '#1B2A3D' : '#EAF2FE', route: '/task/new' },
    { label: 'Start Timer', Icon: Timer, color: dark ? '#6EE7B7' : '#059669', background: dark ? '#16302A' : '#E6F6EC', route: '/focus' },
    { label: 'New Note', Icon: SquarePen, color: dark ? '#6EE7B7' : '#047857', background: dark ? '#16302A' : '#E6F6EC', route: '/spiritual/journal' },
    { label: 'Log Activity', Icon: Flame, color: dark ? '#FDBA74' : '#EA580C', background: dark ? '#39261A' : '#FFF0E4', route: '/spiritual' },
  ];
  const stats = data ? [
    { label: 'Tasks', value: `${data.completedTodayTasks}/${data.totalTodayTasks}`, color: c.ring },
    { label: 'Study', value: `${data.studyHoursThisWeek}h`, color: '#3B82F6' },
    { label: 'Focus', value: `${Math.floor(data.focusMinutesToday / 60)}h ${data.focusMinutesToday % 60}m`, color: '#14B8A6' },
    { label: 'Spiritual', value: data.prayerStreak == null ? '\u2014' : `${data.prayerStreak}d`, color: c.ring },
  ] : [];
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: c.background }]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <View style={styles.greeting}>
          <Text style={[styles.small, { color: c.secondary }]}>Good {hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'},</Text>
          <Text numberOfLines={1} style={[styles.name, { color: c.text }]}>{user?.name.split(' ')[0] || 'you'} {'\uD83D\uDE0A'}</Text>
          <Text style={[styles.tagline, { color: c.secondary }]}>Stay consistent. Make it count.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Quick add" hitSlop={6} onPress={() => setQuickAdd(true)} style={[styles.plus, { backgroundColor: c.primary }]}><Plus size={22} color={c.onPrimary} /></Pressable>
      </View>

      <View style={styles.week}>{week.map(date => {
        const active = date.toDateString() === today.toDateString();
        const past = date < today && !active;
        return <View key={date.toISOString()} accessibilityLabel={`${date.toLocaleDateString()}${active ? ', today' : ''}`} style={styles.day}>
          <View style={[styles.dayChip, active && { backgroundColor: c.primary }]}>
            <Text style={[styles.dayLabel, { color: active ? c.onPrimary : c.secondary }]}>{date.toLocaleDateString('en', { weekday: 'short' })}</Text>
            <Text style={[styles.date, { color: active ? c.onPrimary : past ? c.muted : c.text }]}>{date.getDate()}</Text>
          </View>
        </View>;
      })}</View>

      {summary.isPending ? <Skeleton color={c.track} /> : summary.isError ? <Notice message={errorMessage(summary.error)} retry={() => summary.refetch()} /> : data && <View style={[styles.card, styles.progressCard, cardStyle]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>Today's Progress</Text>
        <View style={styles.progressBody}>
          <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: ratio * 100 }} style={styles.ring}>
            <Svg width={100} height={100} style={styles.ringSvg}><Circle cx={50} cy={50} r={46} stroke={c.track} strokeWidth={8} fill="none" /><Circle cx={50} cy={50} r={46} stroke={c.ring} strokeWidth={8} fill="none" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - ratio)} strokeLinecap="round" rotation={-90} origin="50, 50" /></Svg>
            <View style={styles.ringCenter}><Text style={[styles.ringNumber, { color: c.text }]}>{data.completedTodayTasks}</Text><Text style={[styles.ringTotal, { color: c.secondary }]}>/{data.totalTodayTasks}</Text></View>
          </View>
          <View style={styles.stats}>{stats.map(stat => <View key={stat.label} style={styles.stat}><View style={[styles.dot, { backgroundColor: stat.color }]} /><Text style={[styles.statLabel, { color: c.secondary }]}>{stat.label}</Text><Text style={[styles.statValue, { color: c.text }]}>{stat.value}</Text></View>)}</View>
        </View>
      </View>}

      <View style={[styles.card, styles.block, cardStyle]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>Quick Actions</Text>
        <View style={styles.actions}>{actions.map(({ label, Icon, color, background, route }) => <Pressable key={label} accessibilityRole="button" onPress={() => router.push(route as Href)} style={[styles.action, { backgroundColor: background }]}><Icon size={20} color={color} /><Text numberOfLines={2} style={[styles.actionText, { color: c.text }]}>{label}</Text></Pressable>)}</View>
      </View>

      {data && <>
        <View style={[styles.card, styles.block, cardStyle]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Upcoming</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/tasks')} hitSlop={8} style={styles.textButton}><Text style={[styles.viewAll, { color: c.link }]}>View all</Text></Pressable>
          </View>
          {nextTask ? <Pressable accessibilityRole="checkbox" accessibilityLabel={nextTask.title} accessibilityState={{ checked: nextTask.status === 'done', disabled: update.isPending }} aria-checked={nextTask.status === 'done'} disabled={update.isPending} onPress={() => update.mutate({ id: nextTask.id, status: nextTask.status === 'done' ? 'todo' : 'done' })} style={styles.upcomingRow}>
            <View style={[styles.upcomingIcon, { backgroundColor: c.upcomingTint }]}><ClipboardList size={20} color={c.upcomingIcon} /></View>
            <View style={styles.taskContent}><Text numberOfLines={1} style={[styles.taskTitle, { color: c.text }]}>{nextTask.status === 'done' ? '\u2713 ' : ''}{nextTask.title}</Text><Text numberOfLines={1} style={[styles.taskSubtitle, { color: c.secondary }]}>{formatDue(nextTask.due_date)}</Text></View>
          </Pressable> : <View style={styles.emptyLine}><Text style={[styles.emptyLineText, { color: c.secondary }]}>✓ Nothing coming up · </Text><Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push('/task/new')}><Text style={[styles.emptyLineLink, { color: c.link }]}>Add task</Text></Pressable></View>}
          {update.isError && <Notice message={errorMessage(update.error)} />}
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Start a focus session" onPress={() => router.push('/focus')} style={[styles.focusCard, { backgroundColor: c.card, borderColor: c.border }]}><Text style={[styles.focusLabel, { color: c.accent }]}>TODAY'S FOCUS</Text><Text style={[styles.focusText, { color: c.text }]}>{todayFocus?.title || 'Make space for what matters'}</Text></Pressable>

        <View style={styles.section}>
          <View style={styles.dualGrid}>
            <View style={styles.dualColumn}>
              <Text style={[styles.columnTitle, { color: c.text }]}>Active Goals</Text>
              {goals.slice(0, 2).map(goal => <Pressable key={goal.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/goal/detail', params: { goalId: goal.id } })} style={[styles.miniCard, cardStyle]}><Text numberOfLines={2} style={[styles.miniTitle, { color: c.text }]}>{goal.title}</Text><View style={styles.miniProgressRow}><View style={styles.miniProgress}><Progress value={goal.progress || 0} /></View><Text style={[styles.miniPercent, { color: c.accent }]}>{Math.round(goal.progress || 0)}%</Text></View></Pressable>)}
              <Pressable accessibilityRole="button" accessibilityLabel="Create goal" onPress={() => router.push('/goal/new')} style={[styles.createGoal, { borderColor: c.border }]}><Text style={[styles.createGoalText, { color: c.accent }]}>+ Create goal</Text></Pressable>
            </View>
            <View style={styles.dualColumn}>
              <Text style={[styles.columnTitle, { color: c.text }]}>Project Progress</Text>
              {activeProjects.length ? activeProjects.slice(0, 2).map(project => <Pressable key={project.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/project/detail', params: { projectId: project.id } })} style={[styles.miniCard, cardStyle]}><Text numberOfLines={2} style={[styles.miniTitle, { color: c.text }]}>{project.title}</Text><View style={styles.miniProgressRow}><View style={styles.miniProgress}><Progress value={project.progress || 0} /></View><Text style={[styles.miniPercent, { color: c.accent }]}>{Math.round(project.progress || 0)}%</Text></View></Pressable>) : <View style={styles.projectEmpty}><Text style={[styles.columnEmpty, { color: c.muted }]}>No active projects.</Text><Pressable accessibilityRole="button" accessibilityLabel="View projects" onPress={() => router.push('/projects')} style={({ pressed }) => [styles.projectButton, { borderColor: c.border, backgroundColor: c.projectTint, opacity: pressed ? 0.7 : 1 }]}><Text style={[styles.projectButtonText, { color: c.accent }]}>View projects</Text></Pressable></View>}
            </View>
          </View>
        </View>
      </>}

      <View style={[styles.section, styles.spaceSection]}>
        <View style={styles.sectionHeaderRow}><Text style={[styles.cardTitle, { color: c.text }]}>Your Space</Text><Pressable accessibilityRole="button" accessibilityLabel="Edit space" onPress={() => router.push('/preferences')} style={styles.textButton}><Text style={[styles.spaceEditLink, { color: c.accent }]}>Edit Space</Text></Pressable></View>
        {visibleModules.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.spacePills}>{visibleModules.map(({ name, route, Icon }) => <Pressable key={name} accessibilityRole="button" onPress={() => router.push(route as Href)} style={[styles.spacePill, { backgroundColor: c.card, borderColor: c.border }]}><Icon size={16} color={c.accent} /><Text style={[styles.spacePillText, { color: c.text }]}>{name}</Text></Pressable>)}</ScrollView> : <Text style={[styles.spaceEmpty, { color: c.muted }]}>No space selected yet.</Text>}
      </View>
    </ScrollView>
    <Modal visible={quickAdd} transparent animationType="fade" onRequestClose={() => setQuickAdd(false)}><View style={styles.modalBackdrop}><View accessibilityViewIsModal style={[styles.modalCard, cardStyle]}><View style={styles.modalHeader}><Text style={[styles.cardTitle, { color: c.text }]}>Quick add</Text><Pressable accessibilityRole="button" accessibilityLabel="Close quick add" onPress={() => setQuickAdd(false)} style={styles.textButton}><X size={24} color={c.text} /></Pressable></View>{[{ label: 'Add Task', route: '/task/new' }, { label: 'New goal', route: '/goal/new' }, { label: 'New project', route: '/project/new' }, { label: 'New Note', route: '/spiritual/journal' }].map(item => <Pressable key={item.label} accessibilityRole="button" onPress={() => { setQuickAdd(false); router.push(item.route as Href); }} style={styles.modalAction}><Text style={[styles.link, { color: c.accent }]}>{item.label}</Text></Pressable>)}</View></View></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingBottom: 8 },
  top: { paddingTop: 56, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, greeting: { flex: 1, paddingRight: 12 }, small: { fontSize: 14 }, name: { fontSize: 25, fontWeight: '800', marginTop: 2 }, tagline: { fontSize: 13, marginTop: 3 }, plus: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  week: { marginTop: 20, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between' }, day: { flex: 1, alignItems: 'center' }, dayChip: { width: 40, minHeight: 58, borderRadius: 12, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' }, dayLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0, marginBottom: 4 }, date: { fontSize: 17, fontWeight: '700' },
  card: { marginHorizontal: 20, borderRadius: 18, borderWidth: 1, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 }, progressCard: { marginTop: 20 }, block: { marginTop: 16 }, cardTitle: { fontSize: 17, fontWeight: '700' },
  progressBody: { flexDirection: 'row', alignItems: 'center', marginTop: 16 }, ring: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' }, ringSvg: { position: 'absolute' }, ringCenter: { flexDirection: 'row', alignItems: 'flex-end' }, ringNumber: { fontSize: 24, fontWeight: '800' }, ringTotal: { fontSize: 13, fontWeight: '600', marginBottom: 3 }, stats: { marginLeft: 20, flex: 1, gap: 10 }, stat: { flexDirection: 'row', alignItems: 'center' }, dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 }, statLabel: { fontSize: 13, flex: 1 }, statValue: { fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 }, action: { flex: 1, minWidth: 0, minHeight: 76, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', gap: 7 }, actionText: { fontSize: 10.5, fontWeight: '600', textAlign: 'center', lineHeight: 13 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, viewAll: { fontSize: 13, fontWeight: '600' }, textButton: { minHeight: 32, minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }, upcomingIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, taskContent: { flex: 1, minWidth: 0, justifyContent: 'center' }, taskTitle: { fontSize: 15, fontWeight: '600' }, taskSubtitle: { fontSize: 12.5, marginTop: 2 },
  emptyLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }, emptyLineText: { fontSize: 13 }, emptyLineLink: { fontSize: 13, fontWeight: '600' },
  focusCard: { marginHorizontal: 20, marginTop: 48, marginBottom: 16, borderRadius: 18, borderWidth: 1, padding: 16 }, focusLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 }, focusText: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  section: { marginBottom: 20 }, spaceSection: { marginBottom: 0, paddingBottom: 4 }, sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 }, link: { fontSize: 13, fontWeight: '600' },
  dualGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20 }, dualColumn: { flex: 1, minWidth: 0, gap: 8 }, columnTitle: { fontSize: 16, fontWeight: '700' }, miniCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 }, miniTitle: { fontSize: 13, fontWeight: '600' }, miniProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, miniProgress: { flex: 1, minWidth: 0 }, miniPercent: { fontSize: 11, fontWeight: '700' }, createGoal: { minHeight: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }, createGoalText: { fontSize: 12, fontWeight: '600' }, projectEmpty: { gap: 10, paddingTop: 2 }, projectButton: { alignSelf: 'flex-end', minHeight: 38, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' }, projectButtonText: { fontSize: 12.5, fontWeight: '700' }, columnEmpty: { fontSize: 12, lineHeight: 18 },
  spaceEditLink: { fontSize: 13, fontWeight: '600' }, spacePills: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, paddingVertical: 0 }, spacePill: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 40, borderRadius: 20, borderWidth: 1, paddingHorizontal: 15 }, spacePillText: { fontSize: 13.5, fontWeight: '700' }, spaceEmpty: { fontSize: 13, paddingHorizontal: 20 },
  skeleton: { height: 150, borderRadius: 18, marginTop: 20, marginHorizontal: 20 }, modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }, modalCard: { borderRadius: 20, borderWidth: 1, padding: 20 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, modalAction: { minHeight: 48, justifyContent: 'center' },
});
