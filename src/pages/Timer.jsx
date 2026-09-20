import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Coffee, Zap, ChevronRight, Clock } from 'lucide-react';
import apiClient from '../services/api';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useHaptics } from '../hooks/useHaptics';

const POMODORO_WORK = 25 * 60;
const SHORT_BREAK   = 5  * 60;
const LONG_BREAK    = 15 * 60;

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const playCompletionTone = () => {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
    osc.onended = () => ctx.close();
  } catch (_) {}
};

export default function Timer() {
  const haptics = useHaptics();
  const [tasks, setTasks]               = useState([]);
  const [stats, setStats]               = useState({ total_focus_minutes: 0, pomodoros_completed: 0, tasks_worked: 0, tasks: [] });
  const [sessions, setSessions]         = useState([]);
  const [analytics, setAnalytics]       = useState(null);
  const [mode, setMode]                 = useState('pomodoro');
  const [phase, setPhase]               = useState('idle');
  const [running, setRunning]           = useState(false);
  const [secondsLeft, setSecondsLeft]   = useState(POMODORO_WORK);
  const [targetSeconds, setTargetSeconds] = useState(POMODORO_WORK);
  const [cycleCount, setCycleCount]     = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [deepMinutes, setDeepMinutes]   = useState(50);
  const [message, setMessage]           = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchTasks();
    fetchStats();
    fetchSessions();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (!running) return () => undefined;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) { handleTimerComplete(); return 0; }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(intervalRef.current);
  }, [running, phase, mode, cycleCount]);

  const fetchTasks     = async () => { try { setTasks(await apiClient.get('/tasks')); } catch (_) {} };
  const fetchStats     = async () => { try { setStats(await apiClient.get('/focus-sessions/today-stats')); } catch (_) {} };
  const fetchSessions  = async () => { try { setSessions(await apiClient.get('/focus-sessions')); } catch (_) {} };
  const fetchAnalytics = async () => { try { setAnalytics(await apiClient.get('/focus-sessions/analytics')); } catch (_) {} };

  const saveFocusSession = async (type, durationSeconds) => {
    try {
      await apiClient.post('/focus-sessions', {
        task_id: selectedTaskId || null,
        type,
        duration: Math.max(1, Math.round(durationSeconds / 60)),
        completed_at: new Date().toISOString(),
      });
      fetchStats();
      fetchSessions();
    } catch (_) {}
  };

  const handleTimerComplete = async () => {
    playCompletionTone();
    haptics.success();
    if (mode === 'pomodoro') {
      if (phase === 'work') {
        await saveFocusSession('pomodoro', targetSeconds);
        const nextCycle = cycleCount + 1;
        const nextBreak = nextCycle >= 4 ? LONG_BREAK : SHORT_BREAK;
        setCycleCount(nextCycle >= 4 ? 0 : nextCycle);
        setPhase('break');
        setSecondsLeft(nextBreak);
        setTargetSeconds(nextBreak);
        setMessage(nextCycle >= 4 ? 'Long break — relax for 15 min' : 'Short break — take 5 min');
        setRunning(true);
      } else {
        setPhase('work');
        setSecondsLeft(POMODORO_WORK);
        setTargetSeconds(POMODORO_WORK);
        setMessage('Back to work — 25 min focus');
        setRunning(true);
      }
    }
    if (mode === 'deep' && phase === 'work') {
      await saveFocusSession('deep', targetSeconds);
      setPhase('idle');
      setRunning(false);
      setMessage('Deep work complete — great focus!');
    }
  };

  const startPomodoro = () => {
    haptics.tap();
    setMode('pomodoro'); setPhase('work');
    setSecondsLeft(POMODORO_WORK); setTargetSeconds(POMODORO_WORK);
    setRunning(true); setMessage('Pomodoro started — stay focused!');
  };

  const startDeepWork = () => {
    haptics.tap();
    const mins = Math.max(10, Number(deepMinutes) || 50);
    const secs = mins * 60;
    setMode('deep'); setPhase('work');
    setSecondsLeft(secs); setTargetSeconds(secs);
    setRunning(true); setMessage(`Deep work started — ${mins} min session`);
  };

  const toggleRunning = () => {
    if (phase === 'idle') return;
    haptics.tap();
    setRunning((prev) => !prev);
    setMessage((prev) => (running ? 'Paused' : 'Resumed'));
  };

  const resetTimer = () => {
    haptics.doubleTap();
    setRunning(false); setPhase('idle'); setCycleCount(0); setMode('pomodoro');
    setSecondsLeft(POMODORO_WORK); setTargetSeconds(POMODORO_WORK); setMessage('');
  };

  const progress = targetSeconds ? ((targetSeconds - secondsLeft) / targetSeconds) : 0;
  const isBreak  = phase === 'break';
  const isIdle   = phase === 'idle';

  // SVG ring dimensions
  const SIZE = 240;
  const STROKE = 10;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const dash = CIRC * (1 - progress);

  const phaseLabel = isIdle ? 'Ready'
    : mode === 'pomodoro' ? (isBreak ? (cycleCount === 0 ? 'Long Break' : 'Short Break') : 'Pomodoro')
    : 'Deep Work';

  const ringColor = isBreak ? '#F59E0B' : isIdle ? '#64748B' : '#00B4D8';

  // Weekly chart data
  const weeklyData = useMemo(() => {
    if (!analytics?.weekly) return [];
    const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const map = new Map(analytics.weekly.map((r) => [Number(r.dow), Number(r.minutes) / 60]));
    return names.map((n, i) => ({ day: n, hours: +(map.get(i) || 0).toFixed(2) }));
  }, [analytics]);

  return (
    <div className="space-y-5 page-enter-fade pb-6">

      {/* ── Full-Screen Timer Hero ── */}
      <div
        className="rounded-3xl overflow-hidden relative"
        style={{
          background: isBreak
            ? 'linear-gradient(135deg, #92400E 0%, #F59E0B 100%)'
            : isIdle
            ? 'linear-gradient(135deg, #0A1628 0%, #1B3A5C 100%)'
            : 'linear-gradient(135deg, #0A1628 0%, #064E6B 100%)',
          minHeight: 360,
        }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${ringColor}22 0%, transparent 70%)`,
          }}
        />

        <div className="relative flex flex-col items-center pt-8 pb-6 px-6">
          {/* Phase Label */}
          <div className="flex items-center gap-2 mb-6">
            {isBreak ? <Coffee size={14} className="text-amber-300" /> : <Zap size={14} className="text-[#00B4D8]" />}
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: ringColor }}>
              {phaseLabel}
            </span>
          </div>

          {/* SVG Ring Timer */}
          <div className="relative" style={{ width: SIZE, height: SIZE }}>
            <svg width={SIZE} height={SIZE}>
              {/* Track */}
              <circle
                cx={SIZE/2} cy={SIZE/2} r={R}
                fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE}
              />
              {/* Progress */}
              <circle
                cx={SIZE/2} cy={SIZE/2} r={R}
                fill="none"
                stroke={ringColor}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={dash}
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center',
                  transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease',
                  filter: `drop-shadow(0 0 8px ${ringColor}88)`,
                }}
              />
            </svg>

            {/* Inner content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="font-bold tabular-nums leading-none"
                style={{ fontSize: 52, color: 'white', letterSpacing: -2 }}
              >
                {formatTime(secondsLeft)}
              </span>
              <span className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {isIdle ? 'choose a mode' : `of ${Math.round(targetSeconds / 60)} min`}
              </span>
            </div>
          </div>

          {/* Message */}
          {message && (
            <p className="text-sm text-center mt-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {message}
            </p>
          )}

          {/* Control Buttons */}
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={resetTimer}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <RotateCcw size={18} className="text-white" strokeWidth={1.8} />
            </button>

            <button
              onClick={phase === 'idle' ? startPomodoro : toggleRunning}
              disabled={false}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
              style={{
                background: ringColor,
                boxShadow: `0 4px 20px ${ringColor}66`,
              }}
            >
              {running ? (
                <Pause size={24} className="text-white" fill="white" />
              ) : (
                <Play size={24} className="text-white" fill="white" style={{ marginLeft: 3 }} />
              )}
            </button>

            <button
              onClick={startDeepWork}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <Zap size={18} className="text-white" strokeWidth={1.8} />
            </button>
          </div>

          {/* Mode toggle row */}
          <div className="flex items-center gap-2 mt-5">
            <button
              onClick={startPomodoro}
              className="px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95"
              style={{
                background: mode === 'pomodoro' ? ringColor : 'rgba(255,255,255,0.1)',
                color: 'white',
              }}
            >
              Pomodoro 25m
            </button>
            <button
              onClick={() => {
                const mins = Math.max(10, Number(deepMinutes) || 50);
                setMode('deep');
                if (phase === 'idle') { setSecondsLeft(mins*60); setTargetSeconds(mins*60); }
              }}
              className="px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95"
              style={{
                background: mode === 'deep' ? '#8B5CF6' : 'rgba(255,255,255,0.1)',
                color: 'white',
              }}
            >
              Deep Work
            </button>
          </div>
        </div>
      </div>

      {/* ── Pomodoro cycle dots ── */}
      <div className="mobile-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#0A1628]">Pomodoro Cycle</p>
          <span className="text-xs text-[#8BA3B8]">{cycleCount}/4 → long break</span>
        </div>
        <div className="flex gap-2">
          {[0,1,2,3].map((i) => (
            <div
              key={i}
              className="flex-1 h-2 rounded-full transition-all duration-500"
              style={{ background: i < cycleCount ? '#00B4D8' : '#F0F4F8' }}
            />
          ))}
        </div>
      </div>

      {/* ── Task Selector ── */}
      <div className="mobile-card p-4 space-y-3">
        <p className="text-sm font-semibold text-[#0A1628]">Link to Task</p>
        <select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="w-full h-12 px-4 rounded-2xl border border-[#E8F4F8] bg-[#FAFAFA] text-sm text-[#0A1628] focus:outline-none focus:border-[#00B4D8] transition-all"
        >
          <option value="">No task</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>

        <div>
          <p className="text-sm font-semibold text-[#0A1628] mb-2">Deep Work Duration</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10" max="120" step="5"
              value={deepMinutes}
              onChange={(e) => setDeepMinutes(Number(e.target.value))}
              className="flex-1 accent-[#8B5CF6]"
            />
            <span className="text-sm font-bold text-[#8B5CF6] w-14 text-right">{deepMinutes} min</span>
          </div>
        </div>
      </div>

      {/* ── Today Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatMini label="Focus min" value={stats.total_focus_minutes} color="#00B4D8" />
        <StatMini label="Pomodoros" value={stats.pomodoros_completed} color="#8B5CF6" />
        <StatMini label="Tasks"     value={stats.tasks_worked}        color="#10B981" />
      </div>

      {/* ── Recent Sessions ── */}
      {sessions.length > 0 && (
        <div className="mobile-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F0F4F8]">
            <p className="text-sm font-semibold text-[#0A1628]">Recent Sessions</p>
          </div>
          <div className="divide-y divide-[#F0F4F8]">
            {sessions.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: s.type === 'pomodoro' ? '#E0F7FC' : '#EDE9FE' }}
                  >
                    {s.type === 'pomodoro'
                      ? <Clock size={14} className="text-[#00B4D8]" strokeWidth={2} />
                      : <Zap size={14} className="text-[#8B5CF6]" strokeWidth={2} />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0A1628]">
                      {s.type === 'pomodoro' ? 'Pomodoro' : 'Deep Work'}
                    </p>
                    <p className="text-xs text-[#8BA3B8]">{s.task_title || 'No task'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#0A1628]">{s.duration}m</p>
                  <p className="text-[10px] text-[#8BA3B8]">
                    {new Date(s.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Weekly Focus Chart ── */}
      {weeklyData.length > 0 && (
        <div className="mobile-card p-4">
          <p className="text-sm font-semibold text-[#0A1628] mb-4">Focus This Week</p>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8BA3B8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8BA3B8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', background: '#0A1628', color: 'white', fontSize: 11 }}
                  formatter={(val) => [`${val}h`, 'Focus']}
                />
                <Area type="monotone" dataKey="hours" stroke="#00B4D8" fill="#E0F7FC" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function StatMini({ label, value, color }) {
  return (
    <div className="mobile-card p-3 flex flex-col items-center gap-1">
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#8BA3B8] text-center leading-tight">{label}</p>
    </div>
  );
}
