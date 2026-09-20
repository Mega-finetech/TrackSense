import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, Circle, Clock, Target, Heart, ArrowRight,
  CheckSquare, TrendingUp, Zap, BookOpen, Plus, ChevronRight, Flame
} from 'lucide-react';
import apiClient from '../services/api';
import { useAuthStore, useUIStore } from '../stores';

const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

const GREET_EMOJI = { morning: '🌅', afternoon: '☀️', evening: '🌙' };

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const studyTimer = useUIStore((s) => s.studyTimer);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiClient.get('/dashboard/summary')
      .then((res) => { if (mounted) setSummary(res?.data ?? res); })
      .catch((err) => console.error('Dashboard summary failed', err))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const today = new Date();
  const timeOfDay = today.getHours() < 12 ? 'morning' : today.getHours() < 18 ? 'afternoon' : 'evening';
  const greeting = `Good ${timeOfDay}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-enter-fade space-y-4 pb-4">

      {/* ── Hero Greeting Band ── */}
      <section className="aurora relative overflow-hidden rounded-3xl bg-navy-900 p-6 sm:p-7">
        {/* Decorative grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative">
          <p className="text-2xl" role="img" aria-label={timeOfDay}>{GREET_EMOJI[timeOfDay]}</p>
          <h1 className="mt-2 text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
            {greeting}
          </h1>
          <p className="mt-0.5 text-sm text-cyan-200/70">{formatDate(today)}</p>

          {/* Live study timer chip */}
          {studyTimer && (
            <Link
              to="/study/sessions"
              className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-2.5 backdrop-blur transition-colors hover:bg-white/[0.12]"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-white">Studying: {studyTimer.subject}</span>
                <span className="block text-[10px] text-cyan-200/70">
                  Started {new Date(studyTimer.startTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </span>
              <ChevronRight size={14} className="text-cyan-200/70" />
            </Link>
          )}
        </div>
      </section>

      {/* ── Stat Bento Row ── */}
      <section className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
        <StatTile icon={CheckSquare} label="Due Today"     value={summary?.tasksDueToday ?? 0}         tone="rose" />
        <StatTile icon={Target}      label="Active Goals"  value={summary?.activeGoals ?? 0}           tone="cyan" />
        <StatTile icon={Clock}       label="Study Hrs / wk" value={summary?.studyHoursThisWeek ?? 0}    tone="violet" />
        <StatTile icon={Flame}       label="Prayer Streak" value={`${summary?.prayerStreak ?? 0}d`}    tone="amber" />
        <StatTile icon={TrendingUp}  label="Focus Sessions" value={summary?.focusSessionsThisWeek ?? 0} tone="emerald" />
      </section>

      {/* ── Main Bento Grid ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

        {/* Upcoming Tasks */}
        <BentoCard className="lg:col-span-7">
          <BentoHeader title="Upcoming Tasks" icon={CheckSquare} tone="cyan" viewAllTo="/tasks" />
          {summary?.upcomingTasks?.length ? (
            <ul className="divide-y divide-line">
              {summary.upcomingTasks.slice(0, 5).map((t) => (
                <li key={t.id}>
                  <Link to="/tasks" className="list-row flex items-center gap-3 px-4 py-3.5">
                    <Circle size={18} className="flex-shrink-0 text-ink-mute/50" strokeWidth={1.8} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{t.title}</p>
                      <p className="mt-0.5 text-xs text-ink-mute">
                        Due {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <PriorityDot priority={t.priority} />
                    <ChevronRight size={15} className="text-ink-mute/60" strokeWidth={2} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CheckSquare} label="You're all caught up!" action="Add a task" to="/tasks" />
          )}
        </BentoCard>

        {/* Spiritual Consistency */}
        <BentoCard className="lg:col-span-5">
          <BentoHeader title="Spiritual Week" icon={Heart} tone="rose" viewAllTo="/spiritual" />
          {summary?.spiritualConsistency?.length ? (
            <div className="flex items-end justify-between px-5 py-5">
              {summary.spiritualConsistency.map((d, idx) => {
                const isToday = idx === summary.spiritualConsistency.length - 1;
                return (
                  <div key={d.date} className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                        d.completed
                          ? 'bg-gradient-to-br from-rose-500 to-rose-400 shadow-[0_4px_14px_-4px_rgb(244_63_94/0.6)]'
                          : isToday
                          ? 'border-2 border-dashed border-rose-400'
                          : 'bg-card-muted'
                      }`}
                    >
                      {d.completed && <CheckCircle2 size={16} className="text-white" strokeWidth={2.2} />}
                    </div>
                    <span className={`text-[9px] font-bold uppercase ${isToday ? 'text-ink' : 'text-ink-mute'}`}>
                      {new Date(d.date).toLocaleDateString(undefined, { weekday: 'narrow' })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Heart} label="No spiritual logs yet" action="Log an activity" to="/spiritual" />
          )}
        </BentoCard>

        {/* Active Goals */}
        <BentoCard className="lg:col-span-7">
          <BentoHeader title="Active Goals" icon={Target} tone="violet" viewAllTo="/goals" />
          {summary?.goalsProgress?.length ? (
            <div className="space-y-4 p-5">
              {summary.goalsProgress.slice(0, 3).map((g) => (
                <div key={g.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{g.title}</p>
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-600 dark:text-violet-300">
                      {g.progress}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-card-muted">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${g.progress}%`,
                        background:
                          g.progress >= 75
                            ? 'linear-gradient(to right, #10B981, #00B4D8)'
                            : g.progress >= 40
                            ? 'linear-gradient(to right, #00B4D8, #8B5CF6)'
                            : 'linear-gradient(to right, #F59E0B, #F43F5E)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Target} label="No active goals yet" action="Create a goal" to="/goals" />
          )}
        </BentoCard>

        {/* Quick Actions */}
        <BentoCard className="lg:col-span-5">
          <BentoHeader title="Quick Actions" icon={Zap} tone="amber" />
          <div className="grid grid-cols-2 gap-2.5 p-4">
            <QuickAction icon={CheckSquare} label="Add Task"      to="/tasks" tone="cyan" />
            <QuickAction icon={Target}      label="New Goal"      to="/goals" tone="violet" />
            <QuickAction icon={Clock}       label="Start Timer"   to="/timer" tone="emerald" />
            <QuickAction icon={BookOpen}    label="Study Session" to="/study" tone="amber" />
          </div>
        </BentoCard>
      </div>
    </div>
  );
}

/* ──────────── Sub-components ──────────── */

const TONE_STYLES = {
  cyan:    { chip: 'bg-cyan-500/12 text-cyan-600 dark:text-cyan-300', bar: 'bg-cyan-400' },
  violet:  { chip: 'bg-violet-500/12 text-violet-600 dark:text-violet-300', bar: 'bg-violet-400' },
  amber:   { chip: 'bg-amber-500/14 text-amber-600 dark:text-amber-300', bar: 'bg-amber-400' },
  emerald: { chip: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300', bar: 'bg-emerald-400' },
  rose:    { chip: 'bg-rose-500/12 text-rose-500 dark:text-rose-300', bar: 'bg-rose-400' },
};

function StatTile({ icon: Icon, label, value, tone }) {
  const t = TONE_STYLES[tone];
  return (
    <div className="card-base group min-w-[104px] flex-shrink-0 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:min-w-0">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${t.chip}`}>
        <Icon size={16} strokeWidth={2} />
      </div>
      <p className="text-2xl font-extrabold leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-1.5 text-[11px] font-medium leading-none text-ink-mute">{label}</p>
      <span className={`mt-3 block h-1 w-7 rounded-full ${t.bar} opacity-60 transition-all duration-300 group-hover:w-12 group-hover:opacity-100`} />
    </div>
  );
}

function BentoCard({ className = '', children }) {
  return (
    <section className={`card-base overflow-hidden ${className}`}>
      {children}
    </section>
  );
}

function BentoHeader({ title, icon: Icon, tone, viewAllTo }) {
  const t = TONE_STYLES[tone];
  return (
    <header className="flex items-center justify-between border-b border-line px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${t.chip}`}>
          <Icon size={13} strokeWidth={2.2} />
        </span>
        <h2 className="text-sm font-bold tracking-tight text-ink">{title}</h2>
      </div>
      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="flex items-center gap-0.5 text-xs font-bold text-[var(--ts-accent)] transition-transform hover:translate-x-0.5"
        >
          All <ChevronRight size={13} strokeWidth={2.5} />
        </Link>
      )}
    </header>
  );
}

function PriorityDot({ priority }) {
  const colors = { high: '#F43F5E', medium: '#F59E0B', low: '#10B981' };
  return (
    <span
      className="h-2 w-2 flex-shrink-0 rounded-full"
      style={{ background: colors[priority] ?? colors.low }}
    />
  );
}

function EmptyState({ icon: Icon, label, action, to }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-9">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-muted">
        <Icon size={22} className="text-ink-mute/60" strokeWidth={1.5} />
      </div>
      <p className="text-sm text-ink-mute">{label}</p>
      <Link
        to={to}
        className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-bold text-[var(--ts-accent)] transition-transform active:scale-95"
      >
        <Plus size={12} strokeWidth={2.5} /> {action}
      </Link>
    </div>
  );
}

function QuickAction({ icon: Icon, label, to, tone }) {
  const t = TONE_STYLES[tone];
  return (
    <Link
      to={to}
      className="group flex items-center gap-2.5 rounded-2xl border border-line bg-surface p-3 transition-all duration-200 hover:border-transparent hover:shadow-lift active:scale-[0.97]"
    >
      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${t.chip}`}>
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <span className="text-xs font-bold leading-tight text-ink">{label}</span>
      <ArrowRight
        size={13}
        strokeWidth={2.2}
        className="ml-auto text-ink-mute/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--ts-accent)]"
      />
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 pb-4">
      <div className="skeleton h-36 rounded-3xl" />
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-24 w-28 flex-shrink-0 rounded-2xl" />)}
      </div>
      <div className="skeleton h-48 rounded-2xl" />
      <div className="skeleton h-40 rounded-2xl" />
    </div>
  );
}
