import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

export default function AssignmentsScreen() {
  const route = { params: useLocalSearchParams<{ goalId?: string; projectId?: string }>() };
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-4 py-4">
        <Text className="text-xl font-bold text-navy">Assignments</Text>
      </View>
    </SafeAreaView>
  );
}
