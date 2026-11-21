import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExamCountdownScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-4 py-4">
        <Text className="text-xl font-bold text-navy">Exam Countdown</Text>
      </View>
    </SafeAreaView>
  );
}
