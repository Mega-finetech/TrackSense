import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Pencil, Trash2, X } from 'lucide-react-native';
import type { Course } from '../../types';
import type { StudyPalette } from './studyTheme';

type CourseActionMenuProps = {
  course: Course | null;
  palette: StudyPalette;
  onClose: () => void;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
};

export function CourseActionMenu({ course, palette, onClose, onEdit, onDelete }: CourseActionMenuProps) {
  return (
    <Modal visible={!!course} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close course options" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.eyebrow, { color: palette.muted }]}>COURSE OPTIONS</Text>
              <Text numberOfLines={1} style={[styles.title, { color: palette.text }]}>{course?.code || course?.name}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close course options" onPress={onClose} style={styles.touch}>
              <X size={20} color={palette.text} />
            </Pressable>
          </View>
          {course && (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit Course"
                onPress={() => onEdit(course)}
                style={[styles.action, { borderColor: palette.border, backgroundColor: palette.soft }]}
              >
                <Pencil size={18} color={palette.primary} />
                <Text style={[styles.actionText, { color: palette.text }]}>Edit Course</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete Course"
                onPress={() => onDelete(course)}
                style={[styles.action, { borderColor: '#FECACA', backgroundColor: palette.dark ? '#3B0000' : '#FEF2F2' }]}
              >
                <Trash2 size={18} color="#EF4444" />
                <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete Course</Text>
              </Pressable>
            </>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel course options" onPress={onClose} style={styles.cancel}>
            <Text style={[styles.cancelText, { color: palette.secondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 3 },
  title: { fontSize: 18, fontWeight: '700' },
  touch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  action: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  actionText: { fontSize: 15, fontWeight: '600' },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
