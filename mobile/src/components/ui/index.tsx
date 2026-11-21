import { PropsWithChildren, ReactNode, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, TextProps, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { elevation, radius, space, type } from '../../theme/tokens';

export function Label({ muted, size = type.body, style, ...props }: TextProps & { muted?: boolean; size?: number }) {
  const { colors } = useTheme();
  return <Text {...props} style={[{ color: muted ? colors.muted : colors.text, fontSize: size, lineHeight: size * 1.45 }, style]} />;
}
export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const { colors } = useTheme();
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.screen}>{children}</ScrollView> : <View style={[styles.screen, { flex: 1 }]}>{children}</View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function Card({ style, ...props }: ViewProps) {
  const { colors } = useTheme();
  return <View {...props} style={[{ ...elevation.card, shadowColor: colors.shadow, backgroundColor: colors.surface, padding: space.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, gap: space.md }, style]} />;
}
export function Button({ title, onPress, secondary, loading, disabled, icon }: { title: string; onPress: () => void; secondary?: boolean; loading?: boolean; disabled?: boolean; icon?: ReactNode }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || loading, busy: loading }} disabled={disabled || loading} onPress={onPress}
    style={({ pressed }) => ({ minHeight: 48, padding: space.md, borderRadius: radius.sm, flexDirection: 'row', gap: space.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: secondary ? colors.soft : colors.primary, opacity: disabled || loading ? 0.55 : pressed ? 0.8 : 1 })}>
    {loading ? <ActivityIndicator color={secondary ? colors.primary : colors.onPrimary} /> : <>{icon}<Label style={{ fontWeight: '600', color: secondary ? colors.primary : colors.onPrimary }}>{title}</Label></>}
  </Pressable>;
}
export function Field({ label, error, secureTextEntry, ...props }: TextInputProps & { label: string; error?: string }) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  return <View style={{ gap: space.sm }}><Label size={type.label} style={{ fontWeight: '600' }}>{label}</Label>
    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: error ? colors.danger : colors.border, borderRadius: radius.sm, backgroundColor: colors.surface }}>
      <TextInput {...props} accessibilityLabel={label} secureTextEntry={secureTextEntry && !visible} placeholderTextColor={colors.muted} style={{ flex: 1, minHeight: 52, padding: space.md, color: colors.text, fontSize: type.body }} />
      {secureTextEntry && <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible(!visible)} style={{ padding: space.md }}>{visible ? <EyeOff size={20} color={colors.muted} /> : <Eye size={20} color={colors.muted} />}</Pressable>}
    </View>{error && <Label accessibilityRole="alert" size={type.caption} style={{ color: colors.danger }}>{error}</Label>}
  </View>;
}
export function Brand({ large = false }: { large?: boolean }) {
  return <View style={{ alignItems: 'center', flexDirection: large ? 'column' : 'row', gap: space.md }}>
    <Image source={require('../../../assets/branding/icon.png')} style={{ width: large ? 108 : 40, height: large ? 108 : 40 }} resizeMode="contain" accessibilityLabel="TrackSense" />
    <Label size={large ? type.title : type.heading} style={{ fontWeight: '700', letterSpacing: -0.8 }}>TrackSense</Label>
  </View>;
}
export function Heading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}><View style={{ flex: 1 }}><Label size={type.title} style={{ fontWeight: '700', letterSpacing: -0.7 }}>{title}</Label>{subtitle && <Label muted>{subtitle}</Label>}</View>{action}</View>;
}
export function Notice({ message, retry }: { message: string; retry?: () => void }) {
  const { colors } = useTheme();
  return <Card><Label accessibilityRole="alert" style={{ color: colors.danger }}>{message}</Label>{retry && <Button secondary title="Try again" onPress={retry} />}</Card>;
}
export function Empty({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <Card style={{ padding: space.xl }}><Label style={{ fontWeight: '600' }}>{title}</Label><Label muted>{detail}</Label>{action}</Card>;
}
export function Loading() { const { colors } = useTheme(); return <ActivityIndicator accessibilityLabel="Loading" color={colors.primary} style={{ padding: space.xxl }} />; }
export function Progress({ value }: { value: number }) {
  const { colors } = useTheme();
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: value }} style={{ height: 6, borderRadius: radius.pill, backgroundColor: colors.raised, overflow: 'hidden' }}><View style={{ height: 6, width: `${Math.max(0, Math.min(value, 100))}%`, backgroundColor: colors.accent }} /></View>;
}
export const styles = StyleSheet.create({ screen: { flexGrow: 1, width: '100%', maxWidth: 620, alignSelf: 'center', padding: 20, paddingTop: space.lg, paddingBottom: space.hero, gap: 20 }, row: { flexDirection: 'row', alignItems: 'center', gap: space.md } });
