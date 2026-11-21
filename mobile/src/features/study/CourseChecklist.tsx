import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, Plus, X, type LucideIcon } from 'lucide-react-native';
import type { StudyPalette } from './studyTheme';

export type ChecklistEntry = { id: string; title: string; completed: boolean };

type CourseChecklistProps = {
  title: string;
  /** Singular label used in accessibility text and the empty state. */
  entryLabel: string;
  Icon: LucideIcon;
  items: ChecklistEntry[];
  palette: StudyPalette;
  onToggle: (id: string) => void;
  onAdd: (title: string) => void;
};

/**
 * Shared topic/module checklist. The custom checkbox, strikethrough and dimmed
 * opacity mirror the existing Study assignment rows.
 */
export function CourseChecklist({ title, entryLabel, Icon, items, palette, onToggle, onAdd }: CourseChecklistProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  function submit() {
    const value = draft.trim();
    if (!value) {
      setError(`Enter a ${entryLabel.toLowerCase()} title.`);
      return;
    }
    onAdd(value);
    setDraft('');
    setError('');
    setAdding(false);
  }

  function cancel() {
    setDraft('');
    setError('');
    setAdding(false);
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon size={16} color={palette.primary} />
          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
          <Text style={[styles.count, { color: palette.muted }]}>
            {items.filter(item => item.completed).length}/{items.length}
          </Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={[styles.empty, { borderColor: palette.border, backgroundColor: palette.soft }]}>
          <Text style={[styles.emptyText, { color: palette.secondary }]}>No {entryLabel.toLowerCase()}s yet.</Text>
        </View>
      ) : (
        items.map(item => (
          <Pressable
            key={item.id}
            accessibilityRole="checkbox"
            accessibilityLabel={`Toggle ${entryLabel.toLowerCase()} ${item.title}`}
            accessibilityState={{ checked: item.completed }}
            onPress={() => onToggle(item.id)}
            style={[styles.row, { borderColor: palette.border, backgroundColor: palette.card }]}
          >
            <View style={[styles.checkbox, { borderColor: item.completed ? palette.primary : palette.border, backgroundColor: item.completed ? palette.primary : 'transparent' }]}>
              {item.completed && <Check size={13} color={palette.onPrimary} />}
            </View>
            <Text
              numberOfLines={2}
              style={[styles.label, { color: palette.text }, item.completed && styles.completed]}
            >
              {item.title}
            </Text>
          </Pressable>
        ))
      )}

      {adding ? (
        <View style={styles.addRow}>
          <TextInput
            accessibilityLabel={`${entryLabel} title`}
            value={draft}
            onChangeText={value => {
              setDraft(value);
              if (error) setError('');
            }}
            onSubmitEditing={submit}
            placeholder={`New ${entryLabel.toLowerCase()}`}
            placeholderTextColor={palette.muted}
            autoFocus
            maxLength={500}
            style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.card }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Save ${entryLabel.toLowerCase()}`}
            onPress={submit}
            style={[styles.confirm, { backgroundColor: palette.primary }]}
          >
            <Check size={16} color={palette.onPrimary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Cancel new ${entryLabel.toLowerCase()}`}
            onPress={cancel}
            style={[styles.cancel, { borderColor: palette.border }]}
          >
            <X size={16} color={palette.secondary} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${entryLabel}`}
          onPress={() => setAdding(true)}
          style={[styles.addButton, { borderColor: palette.primary, backgroundColor: `${palette.primary}14` }]}
        >
          <Plus size={14} color={palette.primary} />
          <Text style={[styles.addText, { color: palette.primary }]}>+ Add {entryLabel}</Text>
        </Pressable>
      )}

      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  count: { fontSize: 11, fontWeight: '700' },
  empty: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 8 },
  emptyText: { fontSize: 12, textAlign: 'center' },
  row: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 13, fontWeight: '600' },
  completed: { textDecorationLine: 'line-through', opacity: 0.6 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  input: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 13 },
  confirm: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancel: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  addButton: { minHeight: 38, borderRadius: 19, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, alignSelf: 'flex-start' },
  addText: { fontSize: 12, fontWeight: '700' },
  error: { color: '#EF4444', fontSize: 12, marginTop: 6 },
});
