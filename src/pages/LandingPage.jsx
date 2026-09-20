import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  LayoutDashboard, BookOpen, Heart, Target, CheckSquare,
  Folder, Clock, TrendingUp, Download, ChevronDown, Sparkles,
  Shield, Zap, Star
} from 'lucide-react';

const features = [
  { title: 'Dashboard',  desc: 'Your life at a glance',         icon: LayoutDashboard, tone: 'text-cyan-600 dark:text-cyan-300 bg-cyan-500/12' },
  { title: 'Academic',   desc: 'Courses, exams & sessions',     icon: BookOpen,        tone: 'text-violet-600 dark:text-violet-300 bg-violet-500/12' },
  { title: 'Spiritual',  desc: 'Prayer, devotion & reflection', icon: Heart,           tone: 'text-rose-500 dark:text-rose-300 bg-rose-500/12' },
  { title: 'Goals',      desc: 'Set milestones, track growth',  icon: Target,          tone: 'text-amber-600 dark:text-amber-300 bg-amber-500/14' },
  { title: 'Tasks',      desc: 'Lists, boards & calendars',     icon: CheckSquare,     tone: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/12' },
  { title: 'Projects',   desc: 'Multi-step work, managed',      icon: Folder,          tone: 'text-cyan-600 dark:text-cyan-300 bg-cyan-500/10' },
  { title: 'Timer',      desc: 'Pomodoro & deep focus',         icon: Clock,           tone: 'text-indigo-600 dark:text-indigo-300 bg-indigo-500/12' },
  { title: 'Analytics',  desc: 'Reports across every area',     icon: TrendingUp,      tone: 'text-pink-600 dark:text-pink-300 bg-pink-500/12' },
];

const stats = [
  { label: 'Life Domains', value: '8+' },
  { label: 'Daily Habits', value: '∞' },
  { label: 'Focus Modes',  value: '2' },
];

export default function LandingPage() {
  const token = useAuthStore((state) => state.token);
  const { canInstall, isStandalone, promptInstall } = usePWAInstall();
  const [visible, setVisible] = useState([]);
  const refs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          const i = Number(e.target.dataset.i);
          setVisible((prev) => prev.includes(i) ? prev : [...prev, i]);
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.1 }
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (token) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-ink">

      {/* ── Sticky Glass Header ── */}
      <header className="glass fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-line px-5">
        <Link to="/" className="flex items-center gap-2">
          <img src="/tracksenselogo.png" alt="TrackSense" className="h-8 w-auto" />
          <span className="text-[15px] font-extrabold tracking-tight">TrackSense</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden h-10 items-center rounded-full border border-line px-5 text-sm font-semibold text-ink transition-all hover:border-cyan-400 active:scale-95 sm:inline-flex"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="inline-flex h-10 items-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 px-5 text-sm font-bold text-white shadow-glow transition-all hover:brightness-105 active:scale-95"
          >
            Start Free
          </Link>
        </div>
      </header>

      <main className="pt-16">

        {/* ── Hero ── */}
        <section className="aurora relative overflow-hidden bg-navy-900 px-5 pb-14 pt-20 text-center sm:pt-24">
          {/* Dot texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
              backgroundSize: '26px 26px',
            }}
          />

          <div className="relative mx-auto max-w-2xl">
            {/* Badge */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 animate-fade-up">
              <Sparkles size={13} className="text-cyan-300" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                Full-Spectrum Growth
              </span>
            </div>

            <h1
              className="animate-fade-up text-[40px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl"
              style={{ animationDelay: '60ms' }}
            >
              One app for<br />
              <span className="text-gradient">everything you're building</span>
            </h1>

            <p
              className="mx-auto mt-6 max-w-md text-base leading-relaxed text-navy-100 sm:text-lg animate-fade-up"
              style={{ animationDelay: '120ms' }}
            >
              Academics, goals, tasks, spiritual life &amp; focus time — unified in one calm, beautiful system.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-col items-center gap-3 animate-fade-up" style={{ animationDelay: '180ms' }}>
              <Link
                to="/register"
                className="inline-flex h-14 w-full max-w-xs items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-base font-extrabold text-navy-950 shadow-glow transition-all hover:brightness-105 active:scale-[0.97]"
              >
                Create Free Account
              </Link>

              {canInstall && !isStandalone && (
                <button
                  onClick={promptInstall}
                  className="inline-flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/[0.12] active:scale-[0.97]"
                >
                  <Download size={18} />
                  Install App
                </button>
              )}
            </div>

            {/* Stats row */}
            <div className="mt-12 flex justify-center gap-10 sm:gap-14 animate-fade-up" style={{ animationDelay: '240ms' }}>
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-extrabold tracking-tight text-white">{s.value}</p>
                  <p className="mt-1 text-[11px] font-semibold text-cyan-200/70">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Scroll hint */}
            <div className="mt-12 flex flex-col items-center gap-1.5 opacity-50">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200">Explore</span>
              <ChevronDown size={16} className="animate-bounce text-cyan-200" />
            </div>
          </div>
        </section>

        {/* ── Features Bento ── */}
        <section id="features" className="px-5 py-16">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--ts-accent)]">
              Everything In One Place
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight">All the tools you need</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-mute sm:text-base">
              Eight connected modules that share one timeline, one set of goals, and one version of the truth.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Link
                  key={f.title}
                  to="/register"
                  ref={(el) => { refs.current[i] = el; }}
                  data-i={i}
                  data-visible={visible.includes(i)}
                  className="card-base group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-lift active:scale-[0.97]"
                  style={{
                    opacity: visible.includes(i) ? 1 : 0,
                    transform: visible.includes(i) ? 'translateY(0)' : 'translateY(18px)',
                    transition: `opacity 0.5s ease ${i * 0.05}s, transform 0.5s var(--ease-out-soft) ${i * 0.05}s, box-shadow 0.3s ease, border-color 0.3s ease`,
                  }}
                >
                  <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${f.tone}`}>
                    <Icon size={18} strokeWidth={1.9} />
                  </span>
                  <p className="text-sm font-bold tracking-tight">{f.title}</p>
                  <p className="mt-1 text-xs leading-snug text-ink-mute">{f.desc}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Why TrackSense ── */}
        <section className="bg-card/50 px-5 py-14">
          <div className="mx-auto max-w-md">
            <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">Why TrackSense?</h2>
            <div className="space-y-3.5">
              {[
                { icon: Zap,    tone: 'text-amber-600 dark:text-amber-300 bg-amber-500/14',   title: 'All-in-one', desc: 'No more juggling apps. Everything lives in one place.' },
                { icon: Shield, tone: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/12', title: 'Your data',  desc: 'Hosted by you, private to you. No third-party tracking.' },
                { icon: Star,   tone: 'text-violet-600 dark:text-violet-300 bg-violet-500/12',  title: 'Meaningful', desc: 'Track what truly matters — spirit, mind, body & goals.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="card-base flex items-center gap-4 rounded-2xl p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                    style={{ padding: '1.125rem' }}
                  >
                    <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${item.tone}`}>
                      <Icon size={22} strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="text-sm font-bold tracking-tight">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-mute">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="aurora mx-4 mb-10 mt-6 overflow-hidden rounded-3xl bg-navy-900 p-10 text-center sm:p-14">
          <div className="relative mx-auto max-w-sm">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Ready to grow?</h2>
            <p className="mt-2 text-sm text-cyan-200/80">Free to start. No credit card needed.</p>
            <Link
              to="/register"
              className="mt-7 inline-flex h-13 items-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 px-9 text-sm font-extrabold text-navy-950 shadow-glow transition-all hover:brightness-105 active:scale-[0.97]"
              style={{ height: '52px' }}
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-line px-5 pb-10 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/tracksenselogo.png" alt="" className="h-5 w-auto" />
            <span className="text-xs font-bold text-ink-soft">TrackSense</span>
          </div>
          <div className="flex gap-5">
            <Link to="/login" className="text-xs font-medium text-ink-mute transition-colors hover:text-ink">Login</Link>
            <Link to="/register" className="text-xs font-medium text-ink-mute transition-colors hover:text-ink">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
