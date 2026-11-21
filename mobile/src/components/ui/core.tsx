import { ReactNode } from 'react';
import { Pressable, View, ViewProps } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ArrowLeft, CalendarDays, ChevronRight, Folder, GraduationCap, Heart, Leaf, Target, Wallet } from 'lucide-react-native';
import { Button, Card, Label, Progress } from './index';
import { useTheme } from '../../theme/ThemeProvider';
import { elevation, fidelitySurfaces, fidelityType, iconSize, radius, space, type } from '../../theme/tokens';

export function IconButton({ label, onPress, children, filled = false }: { label: string; onPress: () => void; children: ReactNode; filled?: boolean }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: filled ? colors.primary : colors.surface, opacity: pressed ? 0.8 : 1 })}>{children}</Pressable>;
}
export function AppHeader({ title, onBack, action }: { title: string; onBack?: () => void; action?: ReactNode }) {
  const { colors } = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48 }}>
    <View style={{ width: 44 }}>{onBack && <IconButton label="Go back" onPress={onBack}><ArrowLeft size={iconSize.md} color={colors.text} /></IconButton>}</View>
    <Label accessibilityRole="header" size={18} style={{ flex: 1, textAlign: 'center', fontWeight: '600', letterSpacing: -0.6 }}>{title}</Label>
    <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{action}</View>
  </View>;
}
export function SectionHeader({ title, detail, action, onAction }: { title: string; detail?: string; action?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}><View style={{ flex: 1 }}><Label accessibilityRole="header" size={type.section} style={{ fontWeight: '700', letterSpacing: -0.2 }}>{title}</Label>{detail && <Label muted size={type.caption}>{detail}</Label>}</View>{action && onAction && <Pressable accessibilityRole="button" onPress={onAction} style={{ minHeight: 44, justifyContent: 'center' }}><Label size={type.caption} style={{ color: colors.primary, fontWeight: '600' }}>{action}</Label></Pressable>}</View>;
}
export function FilterBar({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  const { colors } = useTheme();
  return <View style={{ backgroundColor: colors.raised, padding: 3, borderRadius: 24, flexDirection: 'row' }}>{options.map(option => <Pressable key={option} accessibilityRole="tab" accessibilityState={{ selected: value === option }} aria-selected={value === option} onPress={() => onChange(option)} style={{ flex: 1, minHeight: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 22, backgroundColor: value === option ? colors.primary : 'transparent' }}><Label size={13} style={{ fontWeight: value === option ? '600' : '400', color: value === option ? colors.onPrimary : colors.secondary }}>{option}</Label></Pressable>)}</View>;
}
export function ProgressRing({ value, size = 110, children, hero = false }: { value: number; size?: number; children: ReactNode; hero?: boolean }) {
  const { colors, dark } = useTheme(); const stroke = 7; const r = (size - stroke) / 2; const circumference = 2 * Math.PI * r;
  const surface = fidelitySurfaces[dark ? 'dark' : 'light'];
  const percent = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size} height={size} style={{ position: 'absolute' }}><Circle cx={size / 2} cy={size / 2} r={r} stroke={hero ? surface.heroTrack : colors.raised} strokeWidth={stroke} fill="none" /><Circle cx={size / 2} cy={size / 2} r={r} stroke={hero ? surface.heroAccent : colors.accent} strokeWidth={stroke} fill="none" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - percent / 100)} strokeLinecap="round" rotation={-90} origin={`${size / 2}, ${size / 2}`} /></Svg>
    {children}
  </View>;
}
export function StatLine({ label, value, tone = 'accent' }: { label: string; value: string; tone?: 'accent' | 'blue' | 'purple' }) {
  const { colors } = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors[tone] }} /><Label muted size={type.caption} style={{ flex: 1 }}>{label}</Label><Label size={type.caption} style={{ fontWeight: '600' }}>{value}</Label></View>;
}
export function CategoryIcon({ category }: { category?: string }) {
  const { colors } = useTheme();
  const categoryStyle = category === 'Career' ? { Icon: Target, fg: colors.coral, bg: colors.coralSoft } : category === 'Academic' || category === 'Skill Development' ? { Icon: GraduationCap, fg: colors.blue, bg: colors.blueSoft } : category === 'Spiritual' ? { Icon: Leaf, fg: colors.purple, bg: colors.purpleSoft } : category === 'Financial' ? { Icon: Wallet, fg: colors.primary, bg: colors.soft } : category === 'Health' ? { Icon: Heart, fg: colors.coral, bg: colors.coralSoft } : category === 'Project' ? { Icon: Folder, fg: colors.blue, bg: colors.blueSoft } : { Icon: Target, fg: colors.primary, bg: colors.soft };
  return <View style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: categoryStyle.bg, alignItems: 'center', justifyContent: 'center' }}><categoryStyle.Icon size={iconSize.md} color={categoryStyle.fg} /></View>;
}
export type GoalCardData = { id: string; title: string; category?: string; progress?: number; deadline?: string; status?: string };
export function GoalCard({ goal, onPress, compact = false }: { goal: GoalCardData; onPress: () => void; compact?: boolean }) {
  const { colors } = useTheme(); const progress = Math.round(goal.progress || 0);
  return <Pressable accessibilityRole="button" accessibilityLabel={goal.title} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}><FidelityPanel style={{ gap: 8, borderRadius: 12 }}>
    <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}><CategoryIcon category={goal.category} /><View style={{ flex: 1, gap: 3 }}><Label size={type.label} style={{ fontWeight: '600' }}>{goal.title}</Label><Label muted size={type.caption}>{goal.category || 'Personal'}{goal.status && goal.status !== 'active' ? ` · ${goal.status.replace('_', ' ')}` : ''}</Label></View>{compact && <ChevronRight size={iconSize.sm} color={colors.muted} />}</View>
    <View style={{ paddingLeft: 52, gap: 5 }}><View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}><View style={{ flex: 1 }}><Progress value={progress} /></View><Label size={type.caption} style={{ fontWeight: '600', color: colors.primary }}>{progress}%</Label></View>{!compact && <><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><CalendarDays size={12} color={colors.muted} /><Label muted size={type.micro}>{goal.deadline ? `Due ${new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No deadline'}</Label></View><Label muted size={type.micro}>Milestones · {progress === 100 ? 'Complete' : progress > 0 ? 'In progress' : 'Not started'}</Label></>}</View>
  </FidelityPanel></Pressable>;
}
export function QuickAction({ label, icon, onPress }: { label: string; icon: ReactNode; onPress: () => void }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ flex: 1, flexBasis: 0, minWidth: 0, minHeight: 64, alignItems: 'center', gap: 6, opacity: pressed ? 0.65 : 1 })}><View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>{icon}</View><Label numberOfLines={1} size={11} style={{ textAlign: 'center', lineHeight: 17, color: colors.secondary }}>{label}</Label></Pressable>;
}

export function FidelityPanel({ elevated = false, style, ...props }: ViewProps & { elevated?: boolean }) {
  const { colors, dark } = useTheme();
  return <View {...props} style={[{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: elevated ? fidelitySurfaces[dark ? 'dark' : 'light'].elevated : colors.surface, gap: 12, ...(elevated ? { ...elevation.card, shadowColor: colors.shadow } : {}) }, style]} />;
}
export function IntentEmpty({ title, detail, action, onAction }: { title: string; detail: string; action?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  return <View style={{ gap: 14, paddingVertical: 10 }}><View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}><View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}><Leaf size={21} color={colors.primary} /></View><View style={{ flex: 1, gap: 4 }}><Label size={fidelityType.card} style={{ fontWeight: '600' }}>{title}</Label><Label size={fidelityType.support} style={{ color: colors.secondary, lineHeight: 20 }}>{detail}</Label></View></View>{action && onAction && <View style={{ alignSelf: 'flex-start', minWidth: 148, marginLeft: 52 }}><Button title={action} onPress={onAction} /></View>}</View>;
}
