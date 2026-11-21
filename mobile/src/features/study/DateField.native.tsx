import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import dayjs from 'dayjs';
import type { DateFieldProps } from './DateField.types';

function asDate(value: string): Date {
  const parsed = dayjs(value);
  return parsed.isValid() ? new Date(`${parsed.format('YYYY-MM-DD')}T12:00:00`) : new Date();
}

export function DateField({ label, value, onChange, palette, disabled }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const display = dayjs(value).isValid() ? dayjs(value).format('MMM D, YYYY') : 'Select date';

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type !== 'dismissed' && date) onChange(dayjs(date).format('YYYY-MM-DD'));
  }

  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setOpen(current => !current)}
        style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card }]}
      >
        <CalendarDays size={18} color={palette.primary} />
        <Text style={[styles.value, { color: value ? palette.text : palette.muted }]}>{display}</Text>
      </Pressable>
      {open && (
        <View style={[styles.picker, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <DateTimePicker value={asDate(value)} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleChange} />
          {Platform.OS === 'ios' && (
            <Pressable accessibilityRole="button" accessibilityLabel={`Done selecting ${label}`} onPress={() => setOpen(false)} style={styles.done}>
              <Text style={[styles.doneText, { color: palette.primary }]}>Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: { fontSize: 15 },
  picker: { borderWidth: 1, borderRadius: 12, marginTop: 8, padding: 8 },
  done: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  doneText: { fontSize: 15, fontWeight: '700' },
});
