import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, ClipboardList, Clock, Layers3, ListChecks, Plus, X } from 'lucide-react-native';
import dayjs from 'dayjs';
import type { Assignment, Course, Exam } from '../../types';
import {
  calculateCourseProgress,
  courseModules,
  courseTopics,
  hasGrade,
  isAssignmentComplete,
  sortAssignments,
} from './courseProgress';
import { CourseChecklist } from './CourseChecklist';
import { CourseHealthBanner } from './CourseHealthBanner';
import { ExamCountdownBanner } from './ExamCountdownBanner';
import { ProgressRing } from './ProgressRing';
import { AddAssignmentModal } from './AddAssignmentModal';
import type { StudyPalette } from './studyTheme';

type CourseDetailModalProps = {
  course: Course | null;
  assignments: Assignment[];
  exam?: Exam;
  palette: StudyPalette;
  onClose: () => void;
  onToggleAssignment: (assignment: Assignment) => void;
  onAssignmentsChanged: () => void;
  onToggleTopic: (topicId: string) => void;
  onAddTopic: (title: string) => void;
  onToggleModule: (moduleId: string) => void;
  onAddModule: (title: string) => void;
};

export function CourseDetailModal({
  course,
  assignments,
  exam,
  palette,
  onClose,
  onToggleAssignment,
  onAssignmentsChanged,
  onToggleTopic,
  onAddTopic,
  onToggleModule,
  onAddModule,
}: CourseDetailModalProps) {
  const [adding, setAdding] = useState(false);
  const ordered = sortAssignments(assignments);
  const completed = ordered.filter(isAssignmentComplete).length;
  const percent = calculateCourseProgress(course, ordered);
  const topics = courseTopics(course);
  const modules = courseModules(course);

  if (!course) return null;

  return (
    <>
      <Modal visible transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: palette.card }]}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={[styles.eyebrow, { color: palette.muted }]}>COURSE DETAILS</Text>
                <Text numberOfLines={1} style={[styles.heading, { color: palette.text }]}>{course.code || course.name}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close course details" onPress={onClose} style={styles.touch}>
                <X color={palette.text} size={22} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <CourseHealthBanner course={course} assignments={ordered} palette={palette} />
              <ExamCountdownBanner exam={exam} palette={palette} />
              <View style={[styles.progressCard, { borderColor: palette.border, backgroundColor: palette.soft }]}>
                <ProgressRing percent={percent} color={palette.primary} trackColor={palette.border} textColor={palette.text} size={72} strokeWidth={7} />
                <View style={styles.progressBody}>
                  <Text style={[styles.progressTitle, { color: palette.text }]}>Course Progress</Text>
                  <Text style={[styles.progressMeta, { color: palette.secondary }]}>
                    {ordered.length
                      ? `${completed} of ${ordered.length} ${ordered.length === 1 ? 'assignment' : 'assignments'} complete`
                      : topics.length
                        ? `${topics.filter(topic => topic.completed).length} of ${topics.length} topics complete`
                        : 'Add assignments to start tracking progress.'}
                  </Text>
                </View>
              </View>

              <CourseChecklist
                title="Modules"
                entryLabel="Module"
                Icon={Layers3}
                items={modules.map(module => ({ id: module.id, title: module.title, completed: module.isCompleted }))}
                palette={palette}
                onToggle={onToggleModule}
                onAdd={onAddModule}
              />
              <CourseChecklist
                title="Topics"
                entryLabel="Topic"
                Icon={ListChecks}
                items={topics.map(topic => ({ id: topic.id, title: topic.title, completed: topic.completed }))}
                palette={palette}
                onToggle={onToggleTopic}
                onAdd={onAddTopic}
              />

              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <ClipboardList size={16} color={palette.primary} />
                  <Text style={[styles.sectionTitle, { color: palette.text }]}>Assignments</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add Assignment"
                  onPress={() => setAdding(true)}
                  style={[styles.addButton, { borderColor: palette.primary, backgroundColor: `${palette.primary}14` }]}
                >
                  <Plus size={14} color={palette.primary} />
                  <Text style={[styles.addText, { color: palette.primary }]}>Add Assignment</Text>
                </Pressable>
              </View>
              {ordered.length === 0 ? (
                <View style={[styles.empty, { borderColor: palette.border, backgroundColor: palette.soft }]}>
                  <Text style={[styles.emptyTitle, { color: palette.text }]}>No assignments yet</Text>
                  <Text style={[styles.emptyText, { color: palette.secondary }]}>Add one to start tracking course progress.</Text>
                </View>
              ) : ordered.map(assignment => {
                const complete = isAssignmentComplete(assignment);
                return (
                  <Pressable
                    key={assignment.id}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`Toggle ${assignment.title}`}
                    accessibilityState={{ checked: complete }}
                    onPress={() => onToggleAssignment(assignment)}
                    style={[styles.assignment, { borderColor: palette.border, backgroundColor: palette.card }]}
                  >
                    <View style={[styles.checkbox, { borderColor: complete ? palette.primary : palette.border, backgroundColor: complete ? palette.primary : 'transparent' }]}>
                      {complete && <Check size={13} color={palette.onPrimary} />}
                    </View>
                    <View style={styles.assignmentBody}>
                      <Text style={[styles.assignmentTitle, { color: palette.text }, complete && styles.completedTitle]}>{assignment.title}</Text>
                      <View style={styles.metaRow}>
                        <Clock size={11} color={palette.muted} />
                        <Text style={[styles.meta, { color: palette.secondary }]}>{assignment.dueDate ? dayjs(assignment.dueDate).format('MMM D, YYYY') : 'No due date'}</Text>
                        {hasGrade(assignment) && (
                          <Text style={[styles.score, { color: palette.primary }]}>
                            {assignment.earnedScore} / {assignment.totalScore}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text style={[styles.status, { color: complete ? palette.primary : palette.muted, backgroundColor: palette.soft }]}>
                      {complete && hasGrade(assignment) ? 'Graded' : complete ? 'Submitted' : 'Pending'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <AddAssignmentModal course={course} visible={adding} palette={palette} onClose={() => setAdding(false)} onSaved={onAssignmentsChanged} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24, maxHeight: '94%' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 12, marginBottom: 12 },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 3 },
  heading: { fontSize: 20, fontWeight: '700' },
  touch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  progressCard: { borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  progressBody: { flex: 1, marginLeft: 16 },
  progressTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  progressMeta: { fontSize: 12, lineHeight: 17 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  addButton: { minHeight: 36, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  addText: { fontSize: 12, fontWeight: '700' },
  empty: { borderWidth: 1, borderRadius: 14, padding: 18, alignItems: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  emptyText: { fontSize: 12, textAlign: 'center' },
  assignment: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  assignmentBody: { flex: 1 },
  assignmentTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  completedTitle: { textDecorationLine: 'line-through', opacity: 0.7 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 11 },
  score: { fontSize: 11, fontWeight: '800', marginLeft: 4 },
  status: { fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9, overflow: 'hidden' },
});
