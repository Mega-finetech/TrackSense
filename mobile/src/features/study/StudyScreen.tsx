import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Calendar, ChevronLeft, Clock, FileText, MoreVertical, Plus, X } from 'lucide-react-native';
import { randomUUID } from 'expo-crypto';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { errorMessage } from '../../services/errors';
import { Assignment, AssignmentRecord, Course, CourseModule, CourseTopic, Exam } from '../../types';
import { assignmentsForCourse, calculateCourseProgress, courseModules, courseTopics, isAssignmentComplete, nextExamForCourse, sortAssignments, toAssignment, toCourse } from './courseProgress';
import { CourseActionMenu } from './CourseActionMenu';
import { CourseDetailModal } from './CourseDetailModal';
import { ProgressRing } from './ProgressRing';
import { studyPalette } from './studyTheme';

class StudyValidationError extends Error {}
type Tab = 'Courses' | 'Assignments' | 'Exams';
const accents = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626'];
const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date';
const calendarDay = (value: Date) => Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
function usePalette() {
  const { dark } = useTheme();
  return studyPalette(dark);
}
function Skeletons() {
  const c = usePalette(); const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => { const animation = Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true })])); animation.start(); return () => animation.stop(); }, [opacity]);
  return <View accessibilityLabel="Loading study">{[0, 1, 2].map(key => <Animated.View key={key} style={[styles.skeleton, { backgroundColor: c.soft, opacity }]} />)}</View>;
}
export default function StudyScreen({ initialTab = 'Courses' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [creating, setCreating] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [menuCourse, setMenuCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [actionError, setActionError] = useState('');
  const [title, setTitle] = useState(''); const [code, setCode] = useState('');
  const [credits, setCredits] = useState('3'); const [courseId, setCourseId] = useState(''); const [date, setDate] = useState('');
  const c = usePalette(); const userId = useAuthStore(state => state.user?.id); const client = useQueryClient();
  const courses = useQuery({ queryKey: ['courses', userId], enabled: !!userId, queryFn: async () => (await api.get<unknown, Course[]>('/courses')).map(toCourse) });
  const assignments = useQuery({ queryKey: ['assignments', userId], enabled: !!userId, queryFn: async () => (await api.get<unknown, AssignmentRecord[]>('/assignments')).map(toAssignment) });
  const exams = useQuery({ queryKey: ['exams', userId], enabled: !!userId, queryFn: () => api.get<unknown, Exam[]>('/exams') });
  const create = useMutation({ mutationFn: async () => {
    if (!title.trim()) throw new StudyValidationError(tab === 'Courses' ? 'Enter a course name.' : 'Enter a title.');
    let iso: string | null = null;
    if (date) {
      const parsed = new Date(`${date}T12:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new StudyValidationError('Enter a valid date as YYYY-MM-DD.');
      iso = new Date(`${date}T23:59:00`).toISOString();
    }
    if (tab === 'Courses') {
      const amount = Number(credits); if (!Number.isInteger(amount) || amount < 0 || amount > 30) throw new StudyValidationError('Credits must be a whole number from 0 to 30.');
      const payload = { name: title.trim(), code: code.trim(), credits: amount, status: editingCourse?.status || 'active' };
      return editingCourse ? api.put(`/courses/${editingCourse.id}`, payload) : api.post('/courses', payload);
    }
    if (tab === 'Exams' && !iso) throw new StudyValidationError('Enter the exam date.');
    return tab === 'Assignments' ? api.post('/assignments', { title: title.trim(), course_id: courseId || null, due_date: iso, status: 'pending' }) : api.post('/exams', { subject: title.trim(), course_id: courseId || null, exam_date: iso });
  }, onSuccess: async () => { await client.invalidateQueries({ queryKey: [tab.toLowerCase(), userId] }); setCreating(false); setEditingCourse(null); } });
  const openCreate = () => { setEditingCourse(null); setTitle(''); setCode(''); setCredits('3'); setCourseId(''); setDate(''); create.reset(); setCreating(true); };
  const openEdit = (course: Course) => { setTab('Courses'); setEditingCourse(course); setTitle(course.name); setCode(course.code || ''); setCredits(String(course.credits)); setCourseId(''); setDate(''); create.reset(); setCreating(true); };
  const closeCreate = () => { if (create.isPending) return; setCreating(false); setEditingCourse(null); create.reset(); };
  const deleteCourse = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: async () => {
      setActionError('');
      setMenuCourse(null);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['courses', userId] }),
        client.invalidateQueries({ queryKey: ['assignments', userId] }),
        client.invalidateQueries({ queryKey: ['exams', userId] }),
      ]);
    },
    onError: cause => setActionError(errorMessage(cause)),
  });
  function confirmDeleteCourse(course: Course) {
    setMenuCourse(null);
    const message = 'Are you sure you want to remove this course and all associated data?';
    const remove = () => deleteCourse.mutate(course.id);
    // Alert.alert is a no-op on react-native-web, so preview builds use the
    // browser dialog while native builds keep the destructive native alert.
    if (Platform.OS === 'web') {
      const confirm = (globalThis as { confirm?: (text?: string) => boolean }).confirm;
      if (confirm?.(message)) remove();
      return;
    }
    Alert.alert('Delete Course', message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: remove }]);
  }
  const toggleAssignment = useMutation({
    mutationFn: ({ assignment, complete }: { assignment: Assignment; complete: boolean }) => {
      const status = complete ? (assignment.totalScore != null ? 'graded' : 'submitted') : 'pending';
      return api.put(`/assignments/${assignment.id}`, { status });
    },
    onMutate: async ({ assignment, complete }) => {
      setActionError('');
      await client.cancelQueries({ queryKey: ['assignments', userId] });
      const previous = client.getQueryData<Assignment[]>(['assignments', userId]);
      const status = (complete ? (assignment.totalScore != null ? 'graded' : 'submitted') : 'pending') as Assignment['status'];
      client.setQueryData<Assignment[]>(['assignments', userId], current => current?.map(item => item.id === assignment.id ? { ...item, status, isCompleted: complete } : item) ?? current);
      return { previous };
    },
    onError: (cause, _variables, context) => {
      if (context?.previous) client.setQueryData(['assignments', userId], context.previous);
      setActionError(errorMessage(cause));
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['assignments', userId] }),
  });
  const updateCourseContent = useMutation({
    mutationFn: ({ course, fields }: { course: Course; fields: { topics?: CourseTopic[]; modules?: CourseModule[] } }) => api.put(`/courses/${course.id}`, fields),
    onMutate: async ({ course, fields }) => {
      setActionError('');
      await client.cancelQueries({ queryKey: ['courses', userId] });
      const previous = client.getQueryData<Course[]>(['courses', userId]);
      client.setQueryData<Course[]>(['courses', userId], current => current?.map(item => item.id === course.id ? { ...item, ...fields } : item) ?? current);
      return { previous };
    },
    onError: (cause, _variables, context) => {
      if (context?.previous) client.setQueryData(['courses', userId], context.previous);
      setActionError(errorMessage(cause));
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['courses', userId] }),
  });
  const activeCourse = selectedCourse ? courses.data?.find(course => course.id === selectedCourse.id) ?? selectedCourse : null;
  const toggleTopic = (topicId: string) => {
    if (!activeCourse) return;
    updateCourseContent.mutate({
      course: activeCourse,
      fields: { topics: courseTopics(activeCourse).map(topic => topic.id === topicId ? { ...topic, completed: !topic.completed } : topic) },
    });
  };
  const addTopic = (title: string) => {
    if (!activeCourse) return;
    updateCourseContent.mutate({
      course: activeCourse,
      fields: { topics: [...courseTopics(activeCourse), { id: randomUUID(), title, completed: false }] },
    });
  };
  const toggleModule = (moduleId: string) => {
    if (!activeCourse) return;
    updateCourseContent.mutate({
      course: activeCourse,
      fields: { modules: courseModules(activeCourse).map(module => module.id === moduleId ? { ...module, isCompleted: !module.isCompleted } : module) },
    });
  };
  const addModule = (title: string) => {
    if (!activeCourse) return;
    updateCourseContent.mutate({
      course: activeCourse,
      fields: { modules: [...courseModules(activeCourse), { id: randomUUID(), title, isCompleted: false }] },
    });
  };
  const query = tab === 'Courses' ? courses : tab === 'Assignments' ? assignments : exams;
  const cardStyle = { backgroundColor: c.card, borderColor: c.border };
  const courseName = (id?: string) => courses.data?.find(course => course.id === id)?.code || courses.data?.find(course => course.id === id)?.name || 'No course';
  const renderCourse = (course: Course, index: number) => {
    const accent = accents[index % accents.length];
    const next = [...(assignments.data || []).filter(item => item.course_id === course.id && !isAssignmentComplete(item)).map(item => ({ title: item.title, date: item.dueDate })), ...(exams.data || []).filter(item => item.course_id === course.id && new Date(item.exam_date).getTime() >= Date.now()).map(item => ({ title: item.subject, date: item.exam_date }))].sort((a, b) => (a.date ? new Date(a.date).getTime() : Infinity) - (b.date ? new Date(b.date).getTime() : Infinity))[0];
    const courseAssignments = assignmentsForCourse(assignments.data || [], course.id);
    const percent = assignments.isPending ? null : calculateCourseProgress(course, courseAssignments);
    return <View key={course.id} style={styles.courseWrap}>
      <Pressable accessibilityRole="button" accessibilityLabel={course.name} onPress={() => setSelectedCourse(course)} style={[styles.courseCard, styles.courseCardInWrap, cardStyle]}>
        <View style={[styles.accent, { backgroundColor: accent }]} />
        <View style={styles.info}>
          <Text style={[styles.code, { color: c.text }]}>{course.code || course.name}</Text>
          <Text style={[styles.courseName, { color: c.secondary }]}>{course.name}</Text>
          <Text style={[styles.meta, { color: c.muted }]}>{assignments.isPending || exams.isPending ? 'Loading next item...' : assignments.isError || exams.isError ? 'Next item unavailable' : next ? `Next: ${next.title}` : 'No upcoming items'}</Text>
          <Text style={[styles.meta, { color: c.muted }]}>{next?.date ? `Due ${dateLabel(next.date)}` : `${course.credits} credits`}</Text>
        </View>
        <View style={styles.ring}>
          {percent === null
            ? <Text style={[styles.ringText, { color: c.muted }]}>{'\u2014'}</Text>
            : <ProgressRing percent={percent} color={accent} trackColor={c.soft} textColor={c.text} label={`${course.name} ${percent} percent complete`} />}
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Course options for ${course.name}`} hitSlop={6} onPress={() => setMenuCourse(course)} style={styles.menuButton}>
        <MoreVertical size={18} color={c.secondary} />
      </Pressable>
    </View>;
  };
  const renderAssignment = (item: Assignment) => {
    const complete = isAssignmentComplete(item);
    const due = item.dueDate ? new Date(item.dueDate) : null;
    const today = due && calendarDay(due) === calendarDay(new Date());
    const overdue = !complete && due && calendarDay(due) < calendarDay(new Date());
    const label = complete ? item.totalScore != null ? 'Graded' : 'Submitted' : overdue ? 'Overdue' : today ? 'Due Today' : due ? 'Upcoming' : 'No date';
    const color = overdue ? '#DC2626' : today && !complete ? '#D97706' : '#2D6A4F';
    const background = overdue ? '#FEE2E2' : today && !complete ? '#FEF3C7' : '#F0FDF4';
    return <View style={[styles.assignmentCard, cardStyle, { borderLeftColor: color, borderColor: overdue ? c.dark ? '#7F1D1D' : '#FEE2E2' : today && !complete ? c.dark ? '#78350F' : '#FEF3C7' : c.border }]}><View style={styles.row}><Text style={[styles.itemTitle, styles.info, { color: c.text }]}>{item.title}</Text><Text style={[styles.badge, { backgroundColor: background, color }]}>{label}</Text></View><View style={styles.metadata}><Text style={[styles.badge, { backgroundColor: c.soft, color: c.secondary }]}>{courseName(item.course_id)}</Text><Clock size={10} color={c.muted} /><Text style={[styles.meta, { color: c.muted }]}>{dateLabel(item.dueDate)}</Text>{item.totalScore != null && <Text style={[styles.meta, { color: c.primary, fontWeight: '700' }]}>{item.earnedScore ?? 0} / {item.totalScore}</Text>}</View></View>;
  };
  const renderExam = (item: Exam) => {
    const days = Math.round((calendarDay(new Date(item.exam_date)) - calendarDay(new Date())) / 86400000);
    const background = days === 0 ? c.primary : days === 1 ? '#FEF3C7' : c.soft;
    const color = days === 0 ? c.onPrimary : days === 1 ? '#D97706' : c.primary;
    return <View style={[styles.courseCard, cardStyle]}><View style={[styles.countdown, { backgroundColor: background }]}><Text style={[styles.countNumber, { color }]}>{days <= 0 ? days === 0 ? 'TODAY' : 'PAST' : days}</Text>{days > 0 && <Text style={[styles.countLabel, { color }]}>days</Text>}</View><View style={styles.info}><Text style={[styles.code, { color: c.text }]}>{courseName(item.course_id)}</Text><Text style={[styles.courseName, { color: c.secondary }]}>{item.subject}</Text><Text style={[styles.meta, { color: c.muted }]}>{dateLabel(item.exam_date)}</Text></View><Text accessibilityLabel="Preparation status unavailable" style={[styles.meta, { color: c.muted }]}>{'\u2014'}</Text></View>;
  };
  const EmptyIcon = tab === 'Courses' ? BookOpen : tab === 'Assignments' ? FileText : Calendar;
  const selectedAssignments = selectedCourse ? assignmentsForCourse(assignments.data || [], selectedCourse.id) : [];
  const selectedExam = selectedCourse ? nextExamForCourse(exams.data || [], selectedCourse.id) : undefined;
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: c.background }]}><Stack.Screen options={{ headerShown: false }} />
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.touch}><ChevronLeft color={c.text} size={24} /></Pressable><Text accessibilityRole="header" style={[styles.heading, { color: c.text }]}>Study</Text><Pressable accessibilityRole="button" accessibilityLabel={`Add ${tab === 'Courses' ? 'course' : tab === 'Assignments' ? 'assignment' : 'exam'}`} onPress={openCreate} hitSlop={4} style={[styles.plus, { backgroundColor: c.primary }]}><Plus size={18} color={c.onPrimary} /></Pressable></View>
    <View style={styles.tabs}>{(['Courses', 'Assignments', 'Exams'] as const).map(value => <Pressable key={value} accessibilityRole="tab" aria-selected={tab === value} accessibilityState={{ selected: tab === value }} onPress={() => setTab(value)} style={[styles.tab, { backgroundColor: value === tab ? c.primary : c.soft }]}><Text style={[styles.tabText, { color: value === tab ? c.onPrimary : c.secondary, fontWeight: value === tab ? '700' : '500' }]}>{value}</Text></Pressable>)}</View>
    {!!actionError && <Text accessibilityRole="alert" style={styles.actionError}>{actionError}</Text>}
    <FlatList<Course | Assignment | Exam> data={query.isPending || query.isError ? [] : tab === 'Assignments' ? sortAssignments((query.data || []) as Assignment[]) : query.data || []} keyExtractor={item => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list} renderItem={({ item, index }) => tab === 'Courses' ? renderCourse(item as Course, index) : tab === 'Assignments' ? renderAssignment(item as Assignment) : renderExam(item as Exam)} ListEmptyComponent={query.isPending ? <Skeletons /> : query.isError ? <View style={styles.empty}><Text accessibilityRole="alert" style={styles.error}>{errorMessage(query.error)}</Text><Pressable accessibilityRole="button" onPress={() => query.refetch()} style={styles.touch}><Text style={{ color: c.primary }}>Retry</Text></Pressable></View> : <View style={styles.empty}><EmptyIcon size={48} color="#D1D5DB" /><Text style={[styles.emptyTitle, { color: c.secondary }]}>{tab === 'Courses' ? 'No courses yet' : tab === 'Assignments' ? 'No assignments' : 'No upcoming exams'}</Text><Text style={[styles.meta, { color: c.muted }]}>{tab === 'Courses' ? 'Add your first course' : tab === 'Assignments' ? 'All caught up!' : "You're all clear!"}</Text></View>} />
    <Modal visible={creating} transparent animationType="slide" onRequestClose={closeCreate}><KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={[styles.sheet, { backgroundColor: c.card }]}><ScrollView keyboardShouldPersistTaps="handled"><View style={styles.row}><Text style={[styles.heading, styles.info, { color: c.text }]}>{editingCourse ? 'Edit Course' : `New ${tab === 'Courses' ? 'Course' : tab === 'Assignments' ? 'Assignment' : 'Exam'}`}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close create study item" disabled={create.isPending} onPress={closeCreate} style={styles.touch}><X size={22} color={c.text} /></Pressable></View>
      {(tab === 'Courses' ? [{ label: 'Course Code', value: code, set: setCode }, { label: 'Course Name', value: title, set: setTitle }, { label: 'Credits', value: credits, set: setCredits }] : [{ label: tab === 'Exams' ? 'Exam Type / Subject' : 'Title', value: title, set: setTitle }, { label: 'Date (YYYY-MM-DD)', value: date, set: setDate }]).map(field => <View key={field.label} style={styles.fieldGroup}><Text style={[styles.itemTitle, { color: c.text }]}>{field.label}</Text><TextInput accessibilityLabel={field.label} value={field.value} onChangeText={field.set} editable={!create.isPending} keyboardType={field.label === 'Credits' ? 'number-pad' : 'default'} style={[styles.input, { color: c.text, borderColor: c.border }]} /></View>)}
      {tab !== 'Courses' && <View style={styles.fieldGroup}><Text style={[styles.itemTitle, { color: c.text }]}>Course</Text><View style={styles.courseOptions}>{[{ id: '', name: 'No course' }, ...(courses.data || [])].map(course => <Pressable key={course.id} accessibilityRole="radio" accessibilityState={{ checked: course.id === courseId }} onPress={() => setCourseId(course.id)} style={[styles.courseOption, { backgroundColor: course.id === courseId ? c.primary : c.soft }]}><Text style={{ color: course.id === courseId ? c.onPrimary : c.text }}>{course.name}</Text></Pressable>)}</View></View>}
      {create.isError && <Text accessibilityRole="alert" style={styles.error}>{create.error instanceof StudyValidationError ? create.error.message : errorMessage(create.error)}</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: create.isPending, busy: create.isPending }} disabled={create.isPending} onPress={() => create.mutate()} style={[styles.submit, { backgroundColor: c.primary }]}><Text style={[styles.submitText, { color: c.onPrimary }]}>{create.isPending ? 'Saving...' : editingCourse ? 'Save Course' : `Create ${tab === 'Courses' ? 'Course' : tab === 'Assignments' ? 'Assignment' : 'Exam'}`}</Text></Pressable>
    </ScrollView></View></KeyboardAvoidingView></Modal>
    <CourseDetailModal
      course={activeCourse}
      assignments={selectedAssignments}
      exam={selectedExam}
      palette={c}
      onClose={() => setSelectedCourse(null)}
      onToggleAssignment={assignment => toggleAssignment.mutate({ assignment, complete: !isAssignmentComplete(assignment) })}
      onAssignmentsChanged={() => { void client.invalidateQueries({ queryKey: ['assignments', userId] }); }}
      onToggleTopic={toggleTopic}
      onAddTopic={addTopic}
      onToggleModule={toggleModule}
      onAddModule={addModule}
    />
    <CourseActionMenu course={menuCourse} palette={c} onClose={() => setMenuCourse(null)} onEdit={course => { setMenuCourse(null); openEdit(course); }} onDelete={confirmDeleteCourse} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1 }, actionError: { color: '#EF4444', paddingHorizontal: 20, marginTop: 8, fontSize: 13 }, courseWrap: { marginBottom: 14 }, courseCardInWrap: { marginBottom: 0 }, menuButton: { position: 'absolute', top: 6, right: 6, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, header: { paddingTop: 56, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, touch: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, heading: { fontSize: 20, fontWeight: '700' }, plus: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, tabs: { marginTop: 16, paddingHorizontal: 20, flexDirection: 'row', gap: 8 }, tab: { flex: 1, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 20, minHeight: 44, justifyContent: 'center', alignItems: 'center' }, tabText: { fontSize: 14 }, list: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }, courseCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', shadowOpacity: 0.05, elevation: 2 }, accent: { width: 4, alignSelf: 'stretch', borderRadius: 2, marginRight: 14 }, info: { flex: 1 }, code: { fontSize: 14, fontWeight: '800', marginBottom: 2 }, courseName: { fontSize: 12, marginBottom: 8 }, meta: { fontSize: 11, marginBottom: 2 }, ring: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginTop: 10 }, ringSvg: { position: 'absolute' }, ringText: { fontSize: 12, fontWeight: '800' }, assignmentCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 10 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, itemTitle: { fontSize: 14, fontWeight: '600' }, badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontSize: 11, fontWeight: '600' }, metadata: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }, countdown: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 }, countNumber: { fontSize: 20, fontWeight: '800' }, countLabel: { fontSize: 10 }, empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }, emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4 }, skeleton: { height: 120, borderRadius: 16, marginBottom: 14 }, error: { color: '#EF4444', fontSize: 13, marginVertical: 12 }, backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }, sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' }, fieldGroup: { marginTop: 16, gap: 8 }, input: { minHeight: 48, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 }, courseOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, courseOption: { padding: 12, borderRadius: 12 }, submit: { minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 24 }, submitText: { fontSize: 16, fontWeight: '700' },
});
