import { Pressable, View } from 'react-native';
import { Check, Circle } from 'lucide-react-native';
import { Label } from '../../components/ui';
import { Task } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';

export function TaskRow({ task, busy, onToggle }: { task: Task; busy?: boolean; onToggle: () => void }) {
  const { colors } = useTheme();
  const done = task.status === 'done';
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm }}>
    <Pressable accessibilityRole="checkbox" accessibilityLabel={`Complete ${task.title}`} aria-checked={done} accessibilityState={{ checked: done, disabled: busy }} disabled={busy} onPress={onToggle} style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}>
      {done ? <Check color={colors.primary} size={23} /> : <Circle color={colors.muted} size={23} />}
    </Pressable>
    <View style={{ flex: 1, gap: space.xs }}><Label style={{ textDecorationLine: done ? 'line-through' : 'none', fontWeight: '500' }}>{task.title}</Label>
      <Label muted size={12}>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority{task.due_date ? ` · ${new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}</Label>
    </View>
  </View>;
}
