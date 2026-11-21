import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { DateFieldProps } from './DateField.types';

/** Fallback for tooling that does not resolve platform extensions. */
export function DateField({ label, value, onChange, palette, disabled }: DateFieldProps) {
  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={palette.muted}
        style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.card }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 15 },
});
