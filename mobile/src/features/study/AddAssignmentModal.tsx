import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api from '../../services/api';
import { errorMessage } from '../../services/errors';
import { useAuthStore } from '../../stores/authStore';
import type { Course } from '../../types';
import { DateField } from './DateField';
import type { StudyPalette } from './studyTheme';

type AddAssignmentModalProps = {
  course: Course;
  visible: boolean;
  palette: StudyPalette;
  onClose: () => void;
  onSaved?: () => void;
};

class AssignmentValidationError extends Error {}

export function AddAssignmentModal({ course, visible, palette, onClose, onSaved }: AddAssignmentModalProps) {
  const userId = useAuthStore(state => state.user?.id);
  const client = useQueryClient();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [earnedScore, setEarnedScore] = useState('');
  const [totalScore, setTotalScore] = useState('');

  useEffect(() => {
    if (visible) {
      setTitle('');
      setDueDate(dayjs().format('YYYY-MM-DD'));
      setEarnedScore('');
      setTotalScore('');
      create.reset();
    }
  }, [visible]);

  const create = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new AssignmentValidationError('Enter an assignment name.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || !dayjs(dueDate).isValid() || dayjs(dueDate).format('YYYY-MM-DD') !== dueDate) {
        throw new AssignmentValidationError('Enter a valid due date as YYYY-MM-DD.');
      }
      const hasEarned = earnedScore.trim().length > 0;
      const hasTotal = totalScore.trim().length > 0;
      if (hasEarned !== hasTotal) throw new AssignmentValidationError('Enter both earned and total score, or leave both blank.');
      let earned: number | null = null;
      let total: number | null = null;
      if (hasEarned && hasTotal) {
        earned = Number(earnedScore);
        total = Number(totalScore);
        if (!Number.isFinite(earned) || earned < 0 || !Number.isFinite(total) || total <= 0 || earned > total) {
          throw new AssignmentValidationError('Scores must be positive and the earned score cannot exceed the total.');
        }
      }
      const due = dayjs(dueDate).hour(23).minute(59).second(0).millisecond(0).toISOString();
      return api.post<unknown, unknown>('/assignments', {
        course_id: course.id,
        title: title.trim(),
        due_date: due,
        status: hasEarned ? 'graded' : 'pending',
        ...(hasEarned ? { earned_score: earned, total_score: total } : {}),
      });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['assignments', userId] });
      onClose();
      onSaved?.();
    },
  });

  function close() {
    if (!create.isPending) onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.sheet, { backgroundColor: palette.card }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.row}>
              <View style={styles.headerText}>
                <Text style={[styles.heading, { color: palette.text }]}>Add Assignment</Text>
                <Text numberOfLines={1} style={[styles.course, { color: palette.secondary }]}>{course.code || course.name}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close add assignment" disabled={create.isPending} onPress={close} style={styles.touch}>
                <X size={22} color={palette.text} />
              </Pressable>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: palette.text }]}>Assignment Name</Text>
              <TextInput
                accessibilityLabel="Assignment Name"
                value={title}
                onChangeText={setTitle}
                editable={!create.isPending}
                placeholder="e.g. Problem set 4"
                placeholderTextColor={palette.muted}
                style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.card }]}
              />
            </View>
            <DateField label="Due Date" value={dueDate} onChange={setDueDate} palette={palette} disabled={create.isPending} />
            <View style={styles.scoreRow}>
              <View style={styles.scoreField}>
                <Text style={[styles.label, { color: palette.text }]}>Earned Score</Text>
                <TextInput
                  accessibilityLabel="Earned Score"
                  value={earnedScore}
                  onChangeText={setEarnedScore}
                  editable={!create.isPending}
                  keyboardType="decimal-pad"
                  placeholder="Optional"
                  placeholderTextColor={palette.muted}
                  style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.card }]}
                />
              </View>
              <View style={styles.scoreField}>
                <Text style={[styles.label, { color: palette.text }]}>Total Score</Text>
                <TextInput
                  accessibilityLabel="Total Score"
                  value={totalScore}
                  onChangeText={setTotalScore}
                  editable={!create.isPending}
                  keyboardType="decimal-pad"
                  placeholder="Optional"
                  placeholderTextColor={palette.muted}
                  style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.card }]}
                />
              </View>
            </View>
            <Text style={[styles.hint, { color: palette.muted }]}>Adding scores marks the assignment as graded and updates the course score.</Text>
            {create.isError && (
              <Text accessibilityRole="alert" style={styles.error}>
                {create.error instanceof AssignmentValidationError ? create.error.message : errorMessage(create.error)}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save assignment"
              accessibilityState={{ disabled: create.isPending, busy: create.isPending }}
              disabled={create.isPending}
              onPress={() => create.mutate()}
              style={[styles.submit, { backgroundColor: palette.primary, opacity: create.isPending ? 0.65 : 1 }]}
            >
              {create.isPending ? <ActivityIndicator color={palette.onPrimary} /> : <Text style={[styles.submitText, { color: palette.onPrimary }]}>Add Assignment</Text>}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  headerText: { flex: 1 },
  heading: { fontSize: 20, fontWeight: '700' },
  course: { fontSize: 12, marginTop: 4 },
  touch: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  fieldGroup: { marginBottom: 16 },
  scoreRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  scoreField: { flex: 1, minWidth: 0 },
  hint: { fontSize: 11, lineHeight: 16, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 15 },
  error: { color: '#EF4444', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  submit: { minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitText: { fontSize: 16, fontWeight: '700' },
});
