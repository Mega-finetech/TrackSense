import { Tabs } from 'expo-router';
import { BottomNavigation } from '../../../src/components/BottomNavigation';
import { useNotificationsStore } from '../../../src/stores/notificationsStore';

export default function TabLayout() {
  const unreadCount = useNotificationsStore(state => state.unreadCount);
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarShowLabel: true,
    tabBarStyle: {
      backgroundColor: '#0A0F0D',
      borderTopWidth: 1,
      borderTopColor: '#1A2E22',
      height: 72,
      paddingBottom: 12,
      paddingTop: 10,
      paddingHorizontal: 4,
    },
    tabBarItemStyle: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      minWidth: 0,
    },
    tabBarLabelStyle: {
      fontSize: 10,
      marginTop: 4,
      fontWeight: '500',
      textAlign: 'center',
      letterSpacing: 0,
    },
    tabBarActiveTintColor: '#52B788',
    tabBarInactiveTintColor: '#4B6E58',
  }} tabBar={({ state, navigation }) => <BottomNavigation active={state.routes[state.index].name} onSelect={name => {
    const route = state.routes.find(item => item.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(name);
  }} />}>
    <Tabs.Screen name="index" options={{ title: 'Home' }} />
    <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
    <Tabs.Screen name="focus" options={{ title: 'Focus' }} />
    <Tabs.Screen name="analytics" options={{ title: 'Stats' }} />
    {/* tabBarBadge is kept in sync even though the visual pill is rendered by
        the custom BottomNavigation so it matches the existing tab bar design. */}
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarBadge: unreadCount > 0 ? unreadCount : undefined }} />
  </Tabs>;
}
