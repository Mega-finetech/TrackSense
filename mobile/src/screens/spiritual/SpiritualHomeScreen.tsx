import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import apiClient from '../../services/api';

export default function SpiritualHomeScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('prayer');
  const [streaks, setStreaks] = useState<Record<string, any>>({});

  useEffect(() => {
    apiClient.get('/streaks').then((res: any) => {
      const data = res?.data ?? res;
      const map: Record<string, any> = {};
      (data || []).forEach((s: any) => { map[s.type] = s; });
      setStreaks(map);
    }).catch(console.error);
  }, []);

  const tabs = [
    { key: 'prayer', label: 'Prayer Tracker', screen: 'PrayerTracker' },
    { key: 'devotion', label: 'Devotion', screen: null },
    { key: 'bible', label: 'Bible Study', screen: 'BibleStudy' },
    { key: 'journal', label: 'Journal', screen: 'ReflectionJournal' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-xl font-bold text-navy mb-1">Spiritual</Text>
        <Text className="text-sm text-text-muted mb-4">Track your spiritual growth</Text>

        <View className="flex-row flex-wrap gap-2 mb-6">
          {['prayer', 'devotion', 'bible'].map((type) => {
            const s = streaks[type];
            return (
              <View key={type} className="bg-amber-50 rounded-full px-3 py-1.5">
                <Text className="text-xs font-semibold text-amber-800">
                  {type.charAt(0).toUpperCase() + type.slice(1)} {s?.current_count ?? 0}d
                </Text>
              </View>
            );
          })}
        </View>

        <View className="flex-row flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => {
                if (tab.screen) navigation.navigate(tab.screen);
                else setActiveTab(tab.key);
              }}
              className={`px-4 py-2.5 rounded-xl ${
                activeTab === tab.key ? 'bg-purple-600' : 'bg-white border border-border'
              }`}
            >
              <Text className={`text-sm font-semibold ${activeTab === tab.key ? 'text-white' : 'text-navy'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'devotion' && <DevotionView />}
      </ScrollView>
    </SafeAreaView>
  );
}

function DevotionView() {
  const [notes, setNotes] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];
    apiClient.get(`/spiritual/devotion?start=${start}&end=${end}`)
      .then((res: any) => setLogs(res?.data ?? res))
      .catch(console.error);
  }, []);

  const saveDevotion = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await apiClient.post('/spiritual/devotion', { log_date: today, notes });
      await apiClient.post('/streaks/update', { type: 'devotion' });
      setNotes('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View>
      <Text className="text-base font-semibold text-navy mb-3">Daily Devotion</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Write your reflection..."
        multiline
        numberOfLines={4}
        className="w-full px-4 py-3 rounded-2xl border border-border bg-white text-navy mb-3"
      />
      <TouchableOpacity onPress={saveDevotion} className="bg-purple-600 px-5 py-3 rounded-2xl self-start">
        <Text className="text-sm font-semibold text-white">Save Devotion</Text>
      </TouchableOpacity>
    </View>
  );
}
