import { cancelFocusReminder, syncReminders } from '../../services/reminders';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import FocusTimerView from './FocusTimerView';
import type { FocusSession } from '../../types';
import { randomUUID } from 'expo-crypto';
import { z } from 'zod';
import { useAuthStore } from '../../stores/authStore';
import { storage } from '../../services/storage';
import api from '../../services/api';
import { queryClient } from '../../services/query';
import { errorMessage } from '../../services/errors';
import { TimerSession, pauseSession, remainingSeconds, resumeSession } from './clock';

const savedSession = z.object({ id: z.uuid(), durationSeconds: z.number().int().min(60).max(10800), remainingSeconds: z.number().min(0).max(10800), endAt: z.number().nullable() });
export default function FocusScreen() {
  const userId = useAuthStore(state => state.user?.id);
  const history = useQuery({ queryKey: ['focus', userId], enabled: !!userId, queryFn: () => api.get<unknown, FocusSession[]>('/focus-sessions') });
  const key = `tracksense_focus_${userId}`;
  const [session, setSession] = useState<TimerSession | null>(null);
  const [minutes, setMinutes] = useState('25');
  const [now, setNow] = useState(Date.now());
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    storage.get(key).then(value => { if (active && value) setSession(savedSession.parse(JSON.parse(value))); })
      .catch(() => { if (active) setError('Your saved timer could not be restored. You can start a new session.'); })
      .finally(() => { if (active) setReady(true); });
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { active = false; clearInterval(tick); };
  }, [key, userId]);
  async function persist(next: TimerSession | null) {
    setBusy(true); setError(''); setSaved(false);
    try {
      if (next) await storage.set(key, JSON.stringify(next)); else await storage.remove(key);
      setSession(next); setNow(Date.now());
      void cancelFocusReminder().then(() => syncReminders()).catch(() => {});
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  function start() {
    const duration = Number(minutes);
    if (!Number.isInteger(duration) || duration < 1 || duration > 180) { setError('Choose a duration between 1 and 180 minutes.'); return; }
    persist({ id: randomUUID(), durationSeconds: duration * 60, remainingSeconds: duration * 60, endAt: Date.now() + duration * 60_000 });
  }
  async function save() {
    if (!session || remainingSeconds(session, Date.now()) !== 0) return;
    setBusy(true); setError('');
    try {
      await api.post('/focus-sessions', { client_session_id: session.id, type: session.durationSeconds === 1500 ? 'pomodoro' : 'deep', duration: session.durationSeconds / 60, completed_at: new Date(session.endAt ?? Date.now()).toISOString() });
      await storage.remove(key);
      setSession(null); setSaved(true);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['dashboard'] }), queryClient.invalidateQueries({ queryKey: ['focus'] })]);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  const left = session ? remainingSeconds(session, now) : Number(minutes) * 60 || 0;
  return <FocusTimerView ready={ready} busy={busy} error={error} saved={saved} minutes={minutes} left={left} total={session?.durationSeconds || Number(minutes) * 60 || 1500} hasSession={!!session} running={!!session?.endAt && left > 0} onMinutes={setMinutes} onStart={start} onToggle={() => { if (session) void persist(session.endAt ? pauseSession(session, Date.now()) : resumeSession(session, Date.now())); }} onReset={() => { void persist(null); }} onSave={save} sessions={history.data} sessionsLoading={history.isPending} sessionsError={history.isError ? errorMessage(history.error) : undefined} onRetrySessions={() => { void history.refetch(); }} />;
}
