import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import apiClient from '../../services/api';
import { Course } from '../../types';

export default function CoursesScreen({ navigation }: any) {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    apiClient.get('/courses').then((res: any) => setCourses(res?.data ?? res)).catch(console.error);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-4 py-4">
        <Text className="text-xl font-bold text-navy mb-4">Courses</Text>
        {courses.length === 0 ? (
          <Text className="text-text-muted">No courses yet</Text>
        ) : (
          courses.map((c) => (
            <View key={c.id} className="bg-white rounded-2xl p-4 mb-3 border border-border">
              <Text className="text-sm font-semibold text-navy">{c.name}</Text>
              <Text className="text-xs text-text-muted">{c.code} • {c.credits} credits</Text>
            </View>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}
