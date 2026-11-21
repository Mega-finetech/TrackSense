import { View } from 'react-native';
import { router } from 'expo-router';
import { ArrowUpRight, Leaf, Check } from 'lucide-react-native';
import { Brand, Button, Card, Label, Screen } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { space, type } from '../../theme/tokens';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  return <Screen><View style={{ paddingTop: space.xl }}><Brand /></View>
    <View style={{ paddingVertical: space.xl, gap: space.lg }}>
      <Label muted size={12} style={{ letterSpacing: 3 }}>A MORE INTENTIONAL YOU</Label>
      <Label size={type.hero} style={{ fontWeight: '700', letterSpacing: -1.8 }}>Small steps.{ '\n' }A life that grows.</Label>
      <Label muted size={17}>Bring your goals, daily tasks, and moments of focus together. Make progress at your own pace.</Label>
    </View>
    <Card style={{ backgroundColor: colors.soft, padding: space.xl, gap: space.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Leaf size={36} color={colors.primary} /><Label style={{ color: colors.primary, fontWeight: '600' }}>Room to grow</Label></View>
      {['Plan what matters to you', 'Make space for focused work', 'Understand your progress'].map(text => <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}><Check size={18} color={colors.primary} /><Label>{text}</Label></View>)}
    </Card>
    <View style={{ flex: 1 }} />
    <Button title="Get started" icon={<ArrowUpRight size={18} color={colors.onPrimary} />} onPress={() => router.push('/register')} />
    <Button secondary title="I already have an account" onPress={() => router.push('/login')} />
    <Label muted size={12} style={{ textAlign: 'center' }}>Track your life. Understand your progress. Grow intentionally.</Label>
  </Screen>;
}
