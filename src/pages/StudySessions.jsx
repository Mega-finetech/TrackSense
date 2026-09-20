import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../services/api';
import { useUIStore } from '../stores';

export default function StudySessions() {
  const [sessions, setSessions] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [timerSubject, setTimerSubject] = useState('');

  const startStudyTimer = useUIStore((state) => state.startStudyTimer);
  const activeTimer = useUIStore((state) => state.studyTimer);
  const { register, handleSubmit, reset } = useForm();

  const fetchSessions = async () => {
    try {
      const res = await apiClient.get('/study-sessions');
      setSessions(res?.data ?? res);
    } catch (err) {
      console.error('Failed to load sessions', err);
    }
  };

  const fetchWeeklyData = async () => {
    try {
      const res = await apiClient.get('/study-sessions/weekly-hours');
      const data = res?.data ?? res;
      // Format dates for display
      const formatted = data.map((item) => ({
        date: new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }),
        hours: item.hours,
      }));
      setWeeklyData(formatted);
    } catch (err) {
      console.error('Failed to load weekly data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchWeeklyData();
  }, []);

  const onSubmit = async (vals) => {
    try {
      const payload = {
        ...vals,
        duration_minutes: Number(vals.duration_minutes),
      };
      await apiClient.post('/study-sessions', payload);
      setModalOpen(false);
      reset({ duration_minutes: '', subject: '', notes: '' });
      fetchSessions();
      fetchWeeklyData();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const removeSession = async (id) => {
    if (!confirm('Delete this session?')) return;
    await apiClient.delete(`/study-sessions/${id}`);
    fetchSessions();
    fetchWeeklyData();
  };

  if (loading) return <div className="p-6">Loading study sessions...</div>;

  return (
    <div className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Study Sessions</h1>
          <p className="text-sm text-gray-500">Start a timer, review sessions, and track weekly study progress.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTimerModalOpen(true)}
            disabled={!!activeTimer}
            className="px-3 py-1 bg-purple-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Timer
          </button>
          <button onClick={() => setModalOpen(true)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded">+ Log Session</button>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Weekly Study Hours</h2>
        {weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="hours" fill="#9333ea" name="Study Hours" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">No study sessions recorded yet</div>
        )}
      </div>

      {/* Recent Sessions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Sessions</h2>
        <div className="space-y-2">
          {sessions.slice(0, 10).map((session) => (
            <div key={session.id} className="bg-white rounded shadow p-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex-1">
                <div className="font-medium">{session.subject}</div>
                <div className="text-sm text-gray-600">{session.duration_minutes} minutes • {new Date(session.session_date).toLocaleDateString()}</div>
                {session.notes && <div className="text-xs text-gray-500 mt-1">{session.notes}</div>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTimerSubject(session.subject);
                    setTimerModalOpen(true);
                  }}
                  disabled={!!activeTimer}
                  className="text-xs px-2 py-1 border rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Timer
                </button>
                <button onClick={() => removeSession(session.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-lg h-full sm:h-auto overflow-y-auto">
            <h3 className="text-lg font-medium mb-3">Log Study Session</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Subject</label>
                <input {...register('subject', { required: true })} placeholder="e.g., Mathematics" className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Duration (minutes)</label>
                <input type="number" {...register('duration_minutes', { required: true })} className="w-full border rounded px-2 py-1" min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Date</label>
                <input type="date" {...register('session_date', { required: true })} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Notes</label>
                <textarea {...register('notes')} className="w-full border rounded px-2 py-1 h-16" placeholder="Optional notes about the session" />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1 border rounded hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">Log Session</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {timerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-lg h-full sm:h-auto overflow-y-auto">
            <h3 className="text-lg font-medium mb-3">Start Study Timer</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Subject</label>
                <input
                  value={timerSubject}
                  onChange={(e) => setTimerSubject(e.target.value)}
                  placeholder="Enter subject to study"
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setTimerModalOpen(false)} className="px-3 py-1 border rounded hover:bg-gray-100">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    if (!timerSubject.trim()) return;
                    startStudyTimer(timerSubject.trim());
                    setTimerModalOpen(false);
                    setTimerSubject('');
                  }}
                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Start Timer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
