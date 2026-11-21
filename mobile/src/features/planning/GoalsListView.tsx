import { useEffect, useRef } from 'react';
import { Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, BookOpen, Briefcase, ChevronLeft, Clock, DollarSign, Heart, Plus, Target, User } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';

export type GoalListRecord = { id: string; title: string; category?: string; status: string; deadline?: string; progress?: number };
type Props = {
  records: GoalListRecord[]; filter: string; onFilter: (filter: string) => void;
  loading: boolean; error?: string; onRetry: () => void;
  onAdd: () => void; onBack: () => void; onOpen: (id: string) => void;
};
const categories = {
  Career: { Icon: Briefcase, accent: '#2563EB', background: '#DBEAFE' },
  Spiritual: { Icon: Heart, accent: '#DC2626', background: '#FEE2E2' },
  Academic: { Icon: BookOpen, accent: '#7C3AED', background: '#EDE9FE' },
  Personal: { Icon: User, accent: '#D97706', background: '#FEF3C7' },
  Financial: { Icon: DollarSign, accent: '#059669', background: '#D1FAE5' },
  Health: { Icon: Activity, accent: '#DC2626', background: '#FEE2E2' },
  Goals: { Icon: Target, accent: '#2D6A4F', background: '#DCFCE7' },
};
function usePalette() {
  const { dark } = useTheme();
  return { background: dark ? '#0A0F0D' : '#F8F9FA', card: dark ? '#111915' : '#FFFFFF', border: dark ? '#2D4A38' : '#E5E7EB', primary: dark ? '#52B788' : '#1B4332', onPrimary: dark ? '#0A0F0D' : '#FFFFFF', text: dark ? '#F0FDF4' : '#1A1A1A', secondary: dark ? '#86EFAC' : '#6B7280', muted: dark ? '#4B6E58' : '#9CA3AF', track: dark ? '#1A2E22' : '#F3F4F6' };
}
function GoalListCard({ goal, onPress }: { goal: GoalListRecord; onPress: () => void }) {
  const c = usePalette();
  const category = categories[goal.category as keyof typeof categories] || categories.Goals;
  const progress = Math.max(0, Math.min(100, Number.isFinite(goal.progress) ? goal.progress! : 0));
  const animated = useRef(new Animated.Value(0)).current;
  useEffect(() => { const animation = Animated.timing(animated, { toValue: progress, duration: 450, useNativeDriver: false }); animation.start(); return () => animation.stop(); }, [animated, progress]);
  const deadline = goal.deadline ? new Date(goal.deadline) : null;
  const validDate = deadline && Number.isFinite(deadline.getTime());
  const overdue = goal.status !== 'completed' && (goal.status === 'overdue' || (!!validDate && deadline!.getTime() < Date.now()));
  const dateText = overdue ? 'Overdue' : validDate ? `Due ${deadline!.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No deadline';
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={goal.title} activeOpacity={0.7} onPress={onPress} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
    <View style={styles.cardTop}>
      <View style={[styles.icon, { backgroundColor: category.background }]}><category.Icon size={20} color={category.accent} /></View>
      <View style={styles.titleColumn}><Text style={[styles.goalTitle, { color: c.text }]}>{goal.title}</Text><Text style={[styles.category, { color: c.secondary }]}>{goal.category || 'Goals'}</Text></View>
      <Text style={[styles.percentage, { color: category.accent }]}>{Math.round(progress)}%</Text>
    </View>
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: progress }} style={[styles.track, { backgroundColor: c.track }]}><Animated.View style={[styles.fill, { backgroundColor: category.accent, width: animated.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} /></View>
    <View style={styles.dateRow}><Clock size={12} color={overdue ? '#EF4444' : c.muted} /><Text style={[styles.dateText, { color: overdue ? '#EF4444' : c.muted }]}>{dateText}</Text></View>
  </TouchableOpacity>;
}
function Skeletons() {
  const c = usePalette(); const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => { const pulse = Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true })])); pulse.start(); return () => pulse.stop(); }, [opacity]);
  return <View accessibilityLabel="Loading goals">{[0, 1, 2].map(key => <Animated.View key={key} style={[styles.skeleton, { backgroundColor: c.track, opacity }]} />)}</View>;
}
export default function GoalsListView({ records, filter, onFilter, loading, error, onRetry, onAdd, onBack, onOpen }: Props) {
  const c = usePalette();
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: c.background }]}>
    <View style={styles.header}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to home" onPress={onBack} style={styles.back}><ChevronLeft size={24} color={c.text} /></TouchableOpacity><Text accessibilityRole="header" style={[styles.heading, { color: c.text }]}>Goals</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Add goal" hitSlop={4} onPress={onAdd} style={[styles.add, { backgroundColor: c.primary }]}><Plus size={18} color={c.onPrimary} /></TouchableOpacity></View>
    <FlatList data={loading || error ? [] : records} keyExtractor={item => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}
      ListHeaderComponent={<View style={styles.filters}>{['Active', 'Completed', 'All'].map(value => <TouchableOpacity key={value} accessibilityRole="tab" accessibilityState={{ selected: filter === value }} aria-selected={filter === value} onPress={() => onFilter(value)} style={[styles.filter, { backgroundColor: filter === value ? c.primary : c.track }]}><Text style={[styles.filterText, filter === value ? styles.activeText : styles.inactiveText, { color: filter === value ? c.onPrimary : c.secondary }]}>{value}</Text></TouchableOpacity>)}</View>}
      renderItem={({ item }) => <GoalListCard goal={item} onPress={() => onOpen(item.id)} />}
      ListEmptyComponent={loading ? <Skeletons /> : error ? <View style={styles.empty}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><TouchableOpacity accessibilityRole="button" onPress={onRetry} style={[styles.create, { backgroundColor: c.primary }]}><Text style={[styles.createText, { color: c.onPrimary }]}>Try again</Text></TouchableOpacity></View> : <View style={styles.empty}><Target size={48} color="#D1D5DB" /><Text style={[styles.emptyTitle, { color: c.secondary }]}>No goals yet</Text><Text style={[styles.emptyDetail, { color: c.muted }]}>Tap + to create your first goal</Text><TouchableOpacity accessibilityRole="button" onPress={onAdd} style={[styles.create, { backgroundColor: c.primary }]}><Text style={[styles.createText, { color: c.onPrimary }]}>Create Goal</Text></TouchableOpacity></View>}
    />
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { paddingTop: 56, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, back: { width: 36, height: 44, justifyContent: 'center' }, heading: { fontSize: 20, fontWeight: '700' }, add: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  list: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 100 }, filters: { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 16 }, filter: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, minHeight: 44, justifyContent: 'center' }, filterText: { fontSize: 14 }, activeText: { fontWeight: '700' }, inactiveText: { fontWeight: '500' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }, icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }, titleColumn: { flex: 1 }, goalTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 }, category: { fontSize: 12 }, percentage: { fontSize: 16, fontWeight: '800', marginLeft: 8 }, track: { height: 6, borderRadius: 3, marginBottom: 10, width: '100%', overflow: 'hidden' }, fill: { height: 6, borderRadius: 3 }, dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, dateText: { fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }, emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12 }, emptyDetail: { fontSize: 13, marginTop: 4, textAlign: 'center' }, create: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, minHeight: 44, borderRadius: 20, justifyContent: 'center' }, createText: { fontSize: 14, fontWeight: '600' }, error: { color: '#EF4444', fontSize: 14, textAlign: 'center' }, skeleton: { height: 124, borderRadius: 16, marginBottom: 14 },
});
