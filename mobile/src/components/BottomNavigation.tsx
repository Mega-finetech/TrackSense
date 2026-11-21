
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Href, router } from 'expo-router';
import { LayoutDashboard, CheckSquare, Timer, ChartNoAxesColumn, UserRound } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useNotificationsStore } from '../stores/notificationsStore';
import { TAB_BAR_CONTENT_HEIGHT, TAB_BAR_HORIZONTAL_PADDING, useTabBarBottomInset } from './tabBarMetrics';

const destinations = [
  { name: 'index', title: 'Home', path: '/', Icon: LayoutDashboard },
  { name: 'tasks', title: 'Tasks', path: '/tasks', Icon: CheckSquare },
  { name: 'focus', title: 'Focus', path: '/focus', Icon: Timer },
  { name: 'analytics', title: 'Stats', path: '/analytics', Icon: ChartNoAxesColumn },
  { name: 'profile', title: 'Profile', path: '/profile', Icon: UserRound },
];

type BottomNavigationProps = {
  active?: string;
  onSelect?: (name: string) => void;
};

export function BottomNavigation({ active, onSelect }: BottomNavigationProps) {
  const { dark } = useTheme();
  const unreadCount = useNotificationsStore(state => state.unreadCount);
  const bottomInset = useTabBarBottomInset();
  const activeColor = dark ? '#52B788' : '#1B4332';
  const inactiveColor = dark ? '#4B6E58' : '#9CA3AF';

  return (
    <View
      testID="bottom-navigation"
      style={[
        styles.container,
        {
          height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
          paddingBottom: bottomInset,
          backgroundColor: dark ? '#0A0F0D' : '#FFFFFF',
          borderTopColor: dark ? '#1A2E22' : '#E5E7EB',
        },
      ]}
    >
      {destinations.map(({ name, title, path, Icon }) => {
        const selected = name === active;
        const color = selected ? activeColor : inactiveColor;
        return (
          <Pressable
            key={name}
            testID={`bottom-tab-${name}`}
            accessibilityRole="tab"
            accessibilityLabel={title}
            accessibilityState={{ selected }}
            aria-selected={selected}
            onPress={() => onSelect ? onSelect(name) : router.replace(path as Href)}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.65 : 1 }]}
          >
            {selected && <View style={[styles.indicator, { backgroundColor: activeColor }]} />}
            <View testID={`bottom-icon-${name}`} style={styles.icon}>
              <Icon size={22} strokeWidth={1.5} color={color} />
              {name === 'profile' && unreadCount > 0 && (
                <View
                  accessibilityLabel={`${unreadCount} unread alerts`}
                  pointerEvents="none"
                  style={[styles.badge, { borderColor: dark ? '#0A0F0D' : '#FFFFFF' }]}
                >
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
            <Text
              testID={`bottom-label-${name}`}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={[styles.label, { color }]}
            >
              {title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Rendered in flow as the last child of the navigator's flex column so it
  // stretches across the full screen width and never overlays screen content.
  container: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: TAB_BAR_HORIZONTAL_PADDING,
  },
  // One equal slot per destination. flexBasis 0 keeps Android from deriving a
  // base width from the label, so a long label can never widen its slot.
  item: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  indicator: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  icon: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, lineHeight: 11, fontWeight: '700', includeFontPadding: false },
  label: {
    maxWidth: '100%',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
  },
});
