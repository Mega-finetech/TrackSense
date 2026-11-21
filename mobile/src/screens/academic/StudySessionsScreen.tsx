import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import apiClient from '../../services/api';
import { StudySession } from '../../types';

export default function StudySessionsScreen() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    apiClient.get('/study-sessions').then((res: any) => setSessions(res?.data ?? res)).catch(console.error);
  }, []);

  const logSession = async () => {
    if (!subject || !duration) return;
    try {
      await apiClient.post('/study-sessions', {
        subject,
        duration_minutes: parseInt(duration),
        session_date: new Date().toISOString().split('T')[0],
      });
      setSubject('');
      setDuration('');
      const res: any = await apiClient.get('/study-sessions');
      setSessions(res?.data ?? res);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-4 py-4">
        <Text className="text-xl font-bold text-navy mb-4">Study Sessions</Text>

        <View className="bg-white rounded-2xl p-4 mb-4 border border-border">
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Subject"
            className="h-12 px-4 rounded-xl border border-border bg-surface mb-2"
          />
          <TextInput
            value={duration}
            onChangeText={setDuration}
            placeholder="Duration (minutes)"
            keyboardType="numeric"
            className="h-12 px-4 rounded-xl border border-border bg-surface mb-3"
          />
          <TouchableOpacity onPress={logSession} className="bg-cyan px-5 py-3 rounded-2xl self-start">
            <Text className="text-sm font-semibold text-white">Log Session</Text>
          </TouchableOpacity>
        </View>

        {sessions.map((s) => (
          <View key={s.id} className="bg-white rounded-2xl p-4 mb-2 border border-border">
            <Text className="text-sm font-semibold text-navy">{s.subject}</Text>
            <Text className="text-xs text-text-muted">{s.duration_minutes} min</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}
