import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Plus, BookOpen, Flame, CheckCircle2, Pencil, Trash2, Quote } from 'lucide-react';
import apiClient from '../services/api';
import Modal from '../components/ui/Modal';
import { Button, Input, Textarea, Field } from '../components/ui';

const QUOTES = [
  { text: 'Your word is a lamp to my feet and a light to my path.', reference: 'Psalm 119:105' },
  { text: 'Pray without ceasing.', reference: '1 Thessalonians 5:17' },
  { text: 'Search me, O God, and know my heart.', reference: 'Psalm 139:23' },
];

const prayerSlots = ['morning', 'afternoon', 'evening', 'night'];
const journalMoods = ['😊', '😌', '🙏', '💛', '🌿'];

const TABS = [
  { id: 'prayer',   label: 'Prayer Tracker' },
  { id: 'devotion', label: 'Devotion Check-In' },
  { id: 'bible',    label: 'Bible Study Plans' },
  { id: 'journal',  label: 'Reflection Journal' },
];

const formatDate = (date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const getDayLabel = (date) => new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export default function Spiritual() {
  const [activeTab, setActiveTab] = useState('prayer');
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [prayerLogs, setPrayerLogs] = useState([]);
  const [devotionLogs, setDevotionLogs] = useState([]);
  const [biblePlans, setBiblePlans] = useState([]);
  const [planEntries, setPlanEntries] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPrayerDate, setSelectedPrayerDate] = useState(new Date().toISOString().split('T')[0]);
  const [prayerDetails, setPrayerDetails] = useState({ morning: false, afternoon: false, evening: false, night: false });
  const [devotionNotes, setDevotionNotes] = useState('');
  const [streaks, setStreaks] = useState({});
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalSearch, setJournalSearch] = useState('');
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [journalForm, setJournalForm] = useState({ entry_date: new Date().toISOString().split('T')[0], title: '', body: '', mood: '', tags: '' });
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ title: '', total_chapters: 30, chapters_per_day: 2, start_date: new Date().toISOString().split('T')[0] });

  const loadJournalEntries = async (search = '') => {
    try {
      const res = await apiClient.get(`/spiritual/journal${search ? `?q=${encodeURIComponent(search)}` : ''}`);
      setJournalEntries(res?.data ?? res);
    } catch (err) {
      console.error('Unable to load journal entries', err);
    }
  };

  const clearJournalForm = () => {
    setSelectedJournal(null);
    setJournalForm({ entry_date: new Date().toISOString().split('T')[0], title: '', body: '', mood: '', tags: '' });
  };

  const saveJournalEntry = async () => {
    try {
      const entryPayload = {
        entry_date: journalForm.entry_date,
        title: journalForm.title,
        body: journalForm.body,
        mood: journalForm.mood || null,
        tags: journalForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      };

      if (selectedJournal) {
        await apiClient.put(`/spiritual/journal/${selectedJournal.id}`, entryPayload);
      } else {
        await apiClient.post('/spiritual/journal', entryPayload);
      }

      clearJournalForm();
      loadJournalEntries(journalSearch);
    } catch (err) {
      console.error('Unable to save journal entry', err);
    }
  };

  const editJournalEntry = (entry) => {
    setSelectedJournal(entry);
    setJournalForm({
      entry_date: entry.entry_date,
      title: entry.title || '',
      body: entry.body || '',
      mood: entry.mood || '',
      tags: Array.isArray(entry.tags) ? entry.tags.join(', ') : '',
    });
  };

  const deleteJournalEntry = async (entryId) => {
    try {
      await apiClient.delete(`/spiritual/journal/${entryId}`);
      if (selectedJournal?.id === entryId) {
        clearJournalForm();
      }
      loadJournalEntries(journalSearch);
    } catch (err) {
      console.error('Unable to delete journal entry', err);
    }
  };

  const searchJournalEntries = async (value) => {
    setJournalSearch(value);
    await loadJournalEntries(value);
  };

  const loadStreaks = async () => {
    try {
      const res = await apiClient.get('/streaks');
      const data = res?.data ?? res;
      setStreaks(data.reduce((acc, streak) => {
        acc[streak.type] = streak;
        return acc;
      }, {}));
    } catch (err) {
      console.error('Unable to load streaks', err);
    }
  };

  const loadPrayerLogs = async () => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];
    try {
      const res = await apiClient.get(`/spiritual/prayer?start=${start}&end=${end}`);
      setPrayerLogs(res?.data ?? res);
    } catch (err) {
      console.error('Unable to load prayer logs', err);
    }
  };

  const loadDevotionLogs = async () => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];
    try {
      const res = await apiClient.get(`/spiritual/devotion?start=${start}&end=${end}`);
      setDevotionLogs((res?.data ?? res).reverse());
    } catch (err) {
      console.error('Unable to load devotion logs', err);
    }
  };

  const loadBiblePlans = async () => {
    try {
      const res = await apiClient.get('/bible-plans');
      setBiblePlans(res?.data ?? res);
    } catch (err) {
      console.error('Unable to load Bible plans', err);
    }
  };

  const loadPlanEntries = async (planId) => {
    try {
      const res = await apiClient.get(`/bible-plans/${planId}/entries`);
      setPlanEntries(res?.data ?? res);
    } catch (err) {
      console.error('Unable to load plan entries', err);
    }
  };

  useEffect(() => {
    loadPrayerLogs();
    loadDevotionLogs();
    loadBiblePlans();
    loadJournalEntries();
    loadStreaks();
  }, []);

  useEffect(() => {
    if (!selectedPlan) return;
    loadPlanEntries(selectedPlan.id);
  }, [selectedPlan]);

  useEffect(() => {
    const currentLog = prayerLogs.find((item) => item.log_date === selectedPrayerDate);
    if (currentLog?.details) {
      setPrayerDetails({
        morning: !!currentLog.details.morning,
        afternoon: !!currentLog.details.afternoon,
        evening: !!currentLog.details.evening,
        night: !!currentLog.details.night,
      });
    } else {
      setPrayerDetails({ morning: false, afternoon: false, evening: false, night: false });
    }
  }, [selectedPrayerDate, prayerLogs]);

  const prayerHeatmap = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i -= 1) {
      const date = new Date(Date.now() - i * 86400000);
      const iso = date.toISOString().split('T')[0];
      const log = prayerLogs.find((item) => item.log_date === iso);
      const filled = log?.details ? Object.values(log.details).filter(Boolean).length : 0;
      days.push({ date: iso, filled });
    }
    return days;
  }, [prayerLogs]);

  const savePrayerDay = async () => {
    try {
      await apiClient.post('/spiritual/prayer', { log_date: selectedPrayerDate, details: prayerDetails });
      if (selectedPrayerDate === new Date().toISOString().split('T')[0] && Object.values(prayerDetails).some(Boolean)) {
        await apiClient.post('/streaks/update', { type: 'prayer' });
      }
      loadPrayerLogs();
      loadStreaks();
    } catch (err) {
      console.error('Unable to save prayer day', err);
    }
  };

  const saveDevotion = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await apiClient.post('/spiritual/devotion', { log_date: today, notes: devotionNotes });
      await apiClient.post('/streaks/update', { type: 'devotion' });
      setDevotionNotes('');
      loadDevotionLogs();
      loadStreaks();
    } catch (err) {
      console.error('Unable to save devotion note', err);
    }
  };

  const handleCreatePlan = async () => {
    try {
      await apiClient.post('/bible-plans', planForm);
      setNewPlanOpen(false);
      setPlanForm({ title: '', total_chapters: 30, chapters_per_day: 2, start_date: new Date().toISOString().split('T')[0] });
      loadBiblePlans();
    } catch (err) {
      console.error('Unable to create plan', err);
    }
  };

  const togglePlanDay = async (plan, dayDate) => {
    try {
      const existing = planEntries.find((entry) => entry.day_date === dayDate);
      const completed = !(existing?.completed ?? false);
      await apiClient.post(`/bible-plans/${plan.id}/entries`, {
        day_date: dayDate,
        completed,
        notes: existing?.notes || null,
      });

      if (dayDate === new Date().toISOString().split('T')[0] && completed) {
        await apiClient.post('/streaks/update', { type: 'bible' });
      }

      loadPlanEntries(plan.id);
      loadStreaks();
    } catch (err) {
      console.error('Unable to toggle plan day', err);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayDevotion = devotionLogs.find((entry) => entry.log_date === today);
  const todayPrayer = prayerLogs.find((entry) => entry.log_date === today);
  const todayBibleEntry = planEntries.find((entry) => entry.day_date === today && entry.completed);
  const eveningWarning = new Date().getHours() >= 18 && !todayPrayer && !todayDevotion && !todayBibleEntry;

  const getStreak = (type) => streaks[type] || { current_count: 0, longest_count: 0 };

  return (
    <div className="page-enter-fade">

      {/* ── Hero ── */}
      <section className="aurora relative mb-5 overflow-hidden rounded-3xl bg-navy-900 p-6 sm:p-8">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">Spiritual Space</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Calm and intentional growth
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-navy-100">
              Track prayer rhythms, devotion moments, and Bible study plans with a peaceful daily flow.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['prayer', 'devotion', 'bible'].map((type) => {
                const streak = getStreak(type);
                const label = type === 'bible' ? 'Bible' : type.charAt(0).toUpperCase() + type.slice(1);
                return (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur"
                  >
                    <Flame size={12} className={streak.current_count > 0 ? 'text-amber-400' : 'text-white/40'} />
                    {label} {streak.current_count}
                    <span className="font-medium text-white/50">· best {streak.longest_count}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Daily quote */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur lg:max-w-xs">
            <Quote size={18} className="mb-2 text-cyan-300" />
            <p className="text-[15px] italic leading-relaxed text-white">“{quote.text}”</p>
            <p className="mt-3 text-xs font-semibold text-cyan-200/70">— {quote.reference}</p>
          </div>
        </div>
      </section>

      {/* Evening reminder */}
      {eveningWarning && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
          <span className="mt-0.5 text-lg">🌙</span>
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Evening reminder</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-700/90 dark:text-amber-200/80">
              You haven't logged prayer, devotion, or Bible study today. Keep your streak alive before the day ends.
            </p>
          </div>
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
              activeTab === tab.id
                ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-glow'
                : 'border border-line bg-card text-ink-soft hover:border-cyan-400/40 hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PRAYER ── */}
      {activeTab === 'prayer' && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="card-base p-5 sm:p-6">
            <h2 className="text-lg font-extrabold tracking-tight text-ink">Prayer Heatmap</h2>
            <p className="mt-1 text-sm text-ink-mute">
              Mark your morning, afternoon, evening, and night prayers. Watch the 30-day rhythm build.
            </p>

            <div className="mt-5 grid grid-cols-10 gap-1.5">
              {prayerHeatmap.map((day) => {
                const intensity = day.filled;
                const color =
                  intensity === 0 ? 'bg-card-muted'
                  : intensity <= 2 ? 'bg-cyan-500/30'
                  : intensity === 3 ? 'bg-cyan-500/60'
                  : 'bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-glow';
                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedPrayerDate(day.date)}
                    aria-label={`${formatDate(day.date)} • ${day.filled}/4 prayers`}
                    className={`${color} aspect-square w-full rounded-lg border border-line transition-transform hover:scale-110 ${
                      selectedPrayerDate === day.date ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[var(--ts-card)]' : ''
                    }`}
                  />
                );
              })}
            </div>

            {/* Selected day editor */}
            <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-mute">Selected day</p>
                  <h3 className="mt-0.5 text-base font-bold text-ink">{getDayLabel(selectedPrayerDate)}</h3>
                </div>
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-[var(--ts-accent)]">
                  {Object.values(prayerDetails).filter(Boolean).length}/4 done
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {prayerSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setPrayerDetails((prev) => ({ ...prev, [slot]: !prev[slot] }))}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold capitalize transition-all active:scale-95 ${
                      prayerDetails[slot]
                        ? 'border-transparent bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-glow'
                        : 'border-line bg-card text-ink-soft hover:border-cyan-400/40'
                    }`}
                  >
                    {prayerDetails[slot] && <CheckCircle2 size={13} strokeWidth={2.5} />}
                    {slot}
                  </button>
                ))}
              </div>
              <Button onClick={savePrayerDay} className="mt-4 w-full sm:w-auto">
                Save Prayer Rhythm
              </Button>
            </div>
          </section>

          {/* Summary */}
          <section className="space-y-4">
            <div className="card-base p-5">
              <p className="text-xs font-medium text-ink-mute">Days with a full rhythm</p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight text-gradient-dark">
                {prayerHeatmap.filter((day) => day.filled === 4).length}
              </p>
            </div>
            <div className="card-base p-5">
              <p className="text-xs font-medium text-ink-mute">Most recent check-in</p>
              <p className="mt-2 text-base font-bold text-ink">
                {prayerLogs.length ? getDayLabel(prayerLogs[prayerLogs.length - 1].log_date) : 'No entries yet'}
              </p>
            </div>
            <div className="card-base flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/12">
                <Heart size={22} className="text-rose-500" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">{getStreak('prayer').current_count}-day streak</p>
                <p className="text-xs text-ink-mute">Longest: {getStreak('prayer').longest_count} days</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── DEVOTION ── */}
      {activeTab === 'devotion' && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="card-base p-5 sm:p-6">
            <h2 className="text-lg font-extrabold tracking-tight text-ink">Daily Devotion</h2>
            <p className="mt-1 text-sm text-ink-mute">
              Check in each day with a reflection note and build a calm devotional habit.
            </p>
            <Textarea
              rows={7}
              value={devotionNotes}
              onChange={(e) => setDevotionNotes(e.target.value)}
              placeholder="Write about what you reflected on today…"
              className="mt-4"
            />
            <Button onClick={saveDevotion} className="mt-3">Save Check-In</Button>
          </section>

          <section className="card-base overflow-hidden">
            <h2 className="border-b border-line px-5 py-4 text-sm font-bold tracking-tight text-ink">Recent Reflections</h2>
            {devotionLogs.length ? (
              <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
                {devotionLogs.slice(0, 8).map((entry) => (
                  <li key={entry.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-ink-mute">
                      <span>{getDayLabel(entry.log_date)}</span>
                      <span>{entry.notes ? 'Noted' : 'Checked'}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{entry.notes || 'No note entered.'}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-ink-mute">No devotion check-ins yet.</p>
            )}
          </section>
        </div>
      )}

      {/* ── BIBLE ── */}
      {activeTab === 'bible' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-ink">Bible Study Plans</h2>
              <p className="mt-0.5 text-sm text-ink-mute">Set chapters per day and check off each study day.</p>
            </div>
            <Button onClick={() => setNewPlanOpen(true)} size="sm">
              <Plus size={14} strokeWidth={2.2} /> New Plan
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {biblePlans.length ? biblePlans.map((plan) => {
              const completedDays = planEntries.filter((entry) => entry.completed && entry.plan_id === plan.id).length;
              const totalDays = Math.ceil(plan.total_chapters / plan.chapters_per_day);
              const progress = Math.min(100, Math.round((completedDays / totalDays) * 100));
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`card-base cursor-pointer p-5 transition-all hover:shadow-lift ${isSelected ? 'ring-2 ring-cyan-400/60' : ''}`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold tracking-tight text-ink">{plan.title}</h3>
                      <p className="mt-0.5 text-xs text-ink-mute">
                        Start {formatDate(plan.start_date)} · {plan.chapters_per_day} chapters/day
                      </p>
                    </div>
                    <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${isSelected ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300' : 'bg-card-muted text-ink-mute'}`}>
                      <BookOpen size={16} strokeWidth={1.9} />
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-card-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-xs font-semibold">
                    <span className="text-[var(--ts-accent)]">{progress}% complete</span>
                    <span className="text-ink-mute">{completedDays}/{totalDays} days</span>
                  </div>
                </div>
              );
            }) : (
              <div className="card-base col-span-full p-8 text-center text-sm text-ink-mute">
                No Bible study plans yet. Create one to begin your reading rhythm.
              </div>
            )}
          </div>

          {selectedPlan && (
            <div className="card-base p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold tracking-tight text-ink">{selectedPlan.title}</h3>
                  <p className="mt-0.5 text-xs text-ink-mute">
                    First week · tap a day to toggle completion
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => togglePlanDay(selectedPlan, today)}>
                  Toggle Today
                </Button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-7">
                {Array.from({ length: 7 }).map((_, idx) => {
                  const day = new Date(new Date(selectedPlan.start_date).getTime() + idx * 86400000);
                  const dayDate = day.toISOString().split('T')[0];
                  const entry = planEntries.find((item) => item.day_date === dayDate);
                  const done = !!entry?.completed;
                  return (
                    <button
                      key={dayDate}
                      onClick={() => togglePlanDay(selectedPlan, dayDate)}
                      className={`rounded-2xl border p-3 text-left transition-all active:scale-95 ${
                        done
                          ? 'border-transparent bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 ring-1 ring-emerald-500/30'
                          : 'border-line bg-surface hover:border-emerald-400/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-ink-soft">{formatDate(dayDate)}</span>
                        {done
                          ? <CheckCircle2 size={14} className="text-emerald-500" strokeWidth={2.2} />
                          : <span className="h-3.5 w-3.5 rounded-full border-2 border-line" />}
                      </div>
                      <p className="mt-1.5 line-clamp-2 min-h-6 text-[10px] leading-snug text-ink-mute">
                        {entry?.notes || (done ? 'Completed' : 'Tap when done')}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── JOURNAL ── */}
      {activeTab === 'journal' && (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Entries list */}
          <section className="card-base p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-ink">Reflection Journal</h2>
                <p className="mt-0.5 text-sm text-ink-mute">Search by mood, tag, or text.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={clearJournalForm}>
                <Plus size={14} strokeWidth={2.2} /> New Entry
              </Button>
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Input
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchJournalEntries(journalSearch)}
                placeholder="Search journal text or tags…"
                className="flex-1"
              />
              <Button variant="dark" onClick={() => searchJournalEntries(journalSearch)}>Search</Button>
            </div>

            <div className="mt-5 space-y-3">
              {journalEntries.length ? journalEntries.map((entry) => (
                <article key={entry.id} className="group rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-cyan-400/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink-mute">
                        <span className="text-sm">{entry.mood || '✏️'}</span>
                        {formatDate(entry.entry_date)}
                      </div>
                      <h3 className="mt-1 truncate text-sm font-bold text-ink">{entry.title || 'Untitled reflection'}</h3>
                    </div>
                    <div className="flex flex-shrink-0 gap-1.5">
                      <button
                        onClick={() => editJournalEntry(entry)}
                        aria-label="Edit entry"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-card text-ink-soft transition-colors hover:bg-accent-soft hover:text-[var(--ts-accent)]"
                      >
                        <Pencil size={13} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => deleteJournalEntry(entry.id)}
                        aria-label="Delete entry"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-card text-ink-soft transition-colors hover:bg-rose-500/15 hover:text-rose-500"
                      >
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{entry.body}</p>
                  {entry.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-card-muted px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              )) : (
                <p className="py-8 text-center text-sm text-ink-mute">
                  No journal entries yet. Start writing on the right.
                </p>
              )}
            </div>
          </section>

          {/* Editor */}
          <section className="overflow-hidden rounded-3xl bg-navy-900 shadow-lift">
            <div className="border-b border-white/[0.08] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">Writing space</p>
                  <h2 className="mt-0.5 text-base font-bold text-white">Distraction-free editor</h2>
                </div>
                <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                  {selectedJournal ? 'Editing' : 'New'}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 p-5">
              <input
                value={journalForm.title}
                onChange={(e) => setJournalForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Entry title (optional)"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-cyan-400/60"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="date"
                  value={journalForm.entry_date}
                  onChange={(e) => setJournalForm((prev) => ({ ...prev, entry_date: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
                />
                <input
                  value={journalForm.tags}
                  onChange={(e) => setJournalForm((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="Tags (comma separated)"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-400/60"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Mood</p>
                <div className="flex flex-wrap gap-2">
                  {journalMoods.map((mood) => (
                    <button
                      key={mood}
                      onClick={() => setJournalForm((prev) => ({ ...prev, mood }))}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all active:scale-90 ${
                        journalForm.mood === mood
                          ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-glow'
                          : 'bg-white/[0.07] hover:bg-white/[0.14]'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={10}
                value={journalForm.body}
                onChange={(e) => setJournalForm((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="Write your reflection here…"
                className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3.5 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-white/35 focus:border-cyan-400/60"
              />

              <div className="flex items-center justify-between gap-3 pt-1">
                {selectedJournal ? (
                  <button
                    onClick={clearJournalForm}
                    className="text-xs font-semibold text-white/50 transition-colors hover:text-white"
                  >
                    Cancel edit
                  </button>
                ) : (
                  <span className="text-[11px] text-white/35">Write freely. Save to keep your rhythm.</span>
                )}
                <Button size="sm" onClick={saveJournalEntry}>Save Entry</Button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* New Plan Modal */}
      <Modal
        open={newPlanOpen}
        onClose={() => setNewPlanOpen(false)}
        title="New Bible Study Plan"
        footer={
          <div className="flex justify-end gap-2.5">
            <Button variant="secondary" onClick={() => setNewPlanOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePlan}>Create Plan</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <Input value={planForm.title} onChange={(e) => setPlanForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="e.g. Gospel of John" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Chapters">
              <Input type="number" value={planForm.total_chapters} onChange={(e) => setPlanForm((prev) => ({ ...prev, total_chapters: Number(e.target.value) }))} />
            </Field>
            <Field label="Chapters / Day">
              <Input type="number" value={planForm.chapters_per_day} onChange={(e) => setPlanForm((prev) => ({ ...prev, chapters_per_day: Number(e.target.value) }))} />
            </Field>
          </div>
          <Field label="Start Date">
            <Input type="date" value={planForm.start_date} onChange={(e) => setPlanForm((prev) => ({ ...prev, start_date: e.target.value }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
