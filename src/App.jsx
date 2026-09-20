import { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores';
import { ThemeProvider } from './contexts/ThemeContext';
import {
  LayoutDashboard, CheckSquare, BookOpen, Heart, Target,
  Folder, Clock, TrendingUp, Settings as SettingsIcon,
  LogOut, MoreHorizontal, X
} from 'lucide-react';
import StudyTimerWidget from './components/StudyTimerWidget';
import NotificationCenter from './components/NotificationCenter';
import MobileHeader from './components/MobileHeader';
import PrivateRoute from './components/PrivateRoute';
import './index.css';

// Lazy-load all pages for performance
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Goals        = lazy(() => import('./pages/Goals'));
const Tasks        = lazy(() => import('./pages/Tasks'));
const Study        = lazy(() => import('./pages/Study'));
const Courses      = lazy(() => import('./pages/Courses'));
const Assignments  = lazy(() => import('./pages/Assignments'));
const ExamCountdown = lazy(() => import('./pages/ExamCountdown'));
const StudySessions = lazy(() => import('./pages/StudySessions'));
const Spiritual    = lazy(() => import('./pages/Spiritual'));
const Projects     = lazy(() => import('./pages/Projects'));
const Timer        = lazy(() => import('./pages/Timer'));
const Analytics    = lazy(() => import('./pages/Analytics'));
const Settings     = lazy(() => import('./pages/Settings'));
const Login        = lazy(() => import('./pages/Login'));
const Register     = lazy(() => import('./pages/Register'));
const LandingPage  = lazy(() => import('./pages/LandingPage'));

// Primary bottom nav tabs (mobile)
const PRIMARY_TABS = [
  { to: '/dashboard', label: 'Home',     icon: LayoutDashboard },
  { to: '/tasks',     label: 'Tasks',    icon: CheckSquare },
  { to: '/timer',     label: 'Timer',    icon: Clock },
  { to: '/spiritual', label: 'Spirit',   icon: Heart },
  { to: '/more',      label: 'More',     icon: MoreHorizontal, isMore: true },
];

// Secondary "More" menu items
const MORE_ITEMS = [
  { to: '/goals',     label: 'Goals',     icon: Target,      color: 'text-violet-500 bg-violet-500/10' },
  { to: '/projects',  label: 'Projects',  icon: Folder,      color: 'text-cyan-600 bg-cyan-500/10 dark:text-cyan-300' },
  { to: '/study',     label: 'Academic',  icon: BookOpen,    color: 'text-amber-600 bg-amber-500/10 dark:text-amber-300' },
  { to: '/analytics', label: 'Analytics', icon: TrendingUp,  color: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-300' },
  { to: '/settings',  label: 'Settings',  icon: SettingsIcon, color: 'text-navy-400 bg-navy-500/10' },
];

// Skeleton loading state
function PageSkeleton() {
  return (
    <div className="space-y-4 px-4 py-6">
      <div className="skeleton h-6 w-2/3" />
      <div className="skeleton h-4 w-1/2" />
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
      <div className="skeleton mt-4 h-40 rounded-2xl" />
      <div className="skeleton h-40 rounded-2xl" />
    </div>
  );
}

function App() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <ThemeProvider>
      <Router>
        <Suspense fallback={
          <div className="flex min-h-screen items-center justify-center bg-surface">
            <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-cyan-500 border-t-transparent" />
          </div>
        }>
          <Routes>
            <Route path="/"         element={<LandingPage />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <MainLayout onLogout={logout} />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

function MainLayout({ onLogout }) {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard')        return 'Dashboard';
    if (path === '/goals')            return 'Goals';
    if (path === '/tasks')            return 'Tasks';
    if (path.startsWith('/study'))    return 'Academic';
    if (path === '/spiritual')        return 'Spiritual';
    if (path.startsWith('/projects')) return 'Projects';
    if (path === '/timer')            return 'Focus Timer';
    if (path === '/analytics')        return 'Analytics';
    if (path === '/settings')         return 'Settings';
    return 'TrackSense';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">

      {/* ==================== DESKTOP SIDEBAR ==================== */}
      <aside className="hidden w-60 flex-shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-navy-900 lg:flex">
        {/* Logo */}
        <Link to="/dashboard" className="flex h-16 items-center gap-2.5 border-b border-white/[0.06] px-5">
          <img src="/tracksenselogo.png" alt="" className="h-7 w-auto" />
          <span className="text-[15px] font-bold tracking-tight text-white">TrackSense</span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5 no-scrollbar">
          <NavSection label="Overview">
            <SidebarLink to="/dashboard" label="Dashboard" icon={LayoutDashboard} />
          </NavSection>
          <NavSection label="Growth">
            <SidebarLink to="/goals"    label="Goals"    icon={Target} />
            <SidebarLink to="/tasks"    label="Tasks"    icon={CheckSquare} />
            <SidebarLink to="/projects" label="Projects" icon={Folder} />
          </NavSection>
          <NavSection label="Learning">
            <SidebarLink to="/study" label="Academic" icon={BookOpen} />
          </NavSection>
          <NavSection label="Wellbeing">
            <SidebarLink to="/spiritual" label="Spiritual"   icon={Heart} />
            <SidebarLink to="/timer"     label="Focus Timer" icon={Clock} />
          </NavSection>
          <NavSection label="Insights">
            <SidebarLink to="/analytics" label="Analytics" icon={TrendingUp} />
          </NavSection>
        </nav>

        {/* Bottom: Settings + Logout */}
        <div className="space-y-0.5 border-t border-white/[0.06] px-3 py-4">
          <SidebarLink to="/settings" label="Settings" icon={SettingsIcon} />
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-cyan-200/70 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <LogOut size={15} strokeWidth={1.8} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ==================== MAIN AREA ==================== */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Desktop Topbar */}
        <header className="glass sticky top-0 z-30 hidden h-16 flex-shrink-0 items-center justify-between border-b border-line px-8 lg:flex">
          <h2 className="text-base font-bold tracking-tight text-ink">{getPageTitle()}</h2>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <button
              onClick={onLogout}
              className="flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold text-ink-soft transition-colors hover:bg-card-muted hover:text-ink"
            >
              <LogOut size={14} strokeWidth={1.8} />
              Sign Out
            </button>
          </div>
        </header>

        {/* Desktop Content */}
        <main className="hidden flex-1 overflow-y-auto lg:block">
          <div className="mx-auto max-w-6xl px-8 py-8">
            <Suspense fallback={<PageSkeleton />}>
              <AppRoutes />
            </Suspense>
          </div>
        </main>

        {/* ==================== MOBILE LAYOUT ==================== */}
        <div className="flex flex-1 flex-col overflow-hidden lg:hidden">
          <MobileHeader />

          <main
            id="mobile-main-content"
            className="overscroll-y flex-1"
            style={{ paddingBottom: 'var(--bottom-nav-total)' }}
          >
            <div className="px-4 py-4">
              <Suspense fallback={<PageSkeleton />}>
                <AppRoutes />
              </Suspense>
            </div>
          </main>

          {/* Floating Glass Tab Bar */}
          <nav
            className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <div
              className="glass-dark pointer-events-auto flex w-full max-w-md items-stretch rounded-3xl border border-white/10 shadow-float"
              style={{ height: 'var(--bottom-nav-h)' }}
            >
              {PRIMARY_TABS.map((tab) =>
                tab.isMore ? (
                  <button
                    key="more"
                    onClick={() => setMoreOpen(true)}
                    className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all active:scale-90 ${
                      moreOpen ? 'text-cyan-300' : 'text-white/55'
                    }`}
                  >
                    <MoreHorizontal size={21} strokeWidth={activeWeight(moreOpen)} />
                    <span>More</span>
                  </button>
                ) : (
                  <BottomTab key={tab.to} tab={tab} />
                )
              )}
            </div>
          </nav>

          {/* "More" Overlay Drawer */}
          {moreOpen && (
            <>
              <div
                className="fixed inset-0 z-50 animate-fade-in bg-navy-950/50 backdrop-blur-sm"
                onClick={() => setMoreOpen(false)}
              />
              <div
                className="fixed inset-x-0 bottom-0 z-50 animate-slide-up rounded-t-3xl border-t border-line bg-card shadow-float"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
              >
                <div className="flex justify-center pt-3">
                  <span className="h-1.5 w-10 rounded-full bg-line" />
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-bold text-ink">More</span>
                  <button
                    onClick={() => setMoreOpen(false)}
                    aria-label="Close menu"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-card-muted text-ink-soft"
                  >
                    <X size={15} strokeWidth={2} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2.5 px-4 py-3">
                  {MORE_ITEMS.map((item) => (
                    <MoreItem key={item.to} item={item} onClose={() => setMoreOpen(false)} />
                  ))}
                </div>
                <div className="border-t border-line px-4 pb-1 pt-3">
                  <button
                    onClick={() => { onLogout(); setMoreOpen(false); }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500/10 py-3.5 text-sm font-bold text-rose-500 transition-colors active:bg-rose-500/20"
                  >
                    <LogOut size={16} strokeWidth={2} />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <StudyTimerWidget />
    </div>
  );
}

const activeWeight = (active) => (active ? 2.2 : 1.7);

// Shared route definitions
function AppRoutes() {
  return (
    <Routes>
      <Route path="/dashboard"         element={<Dashboard />} />
      <Route path="/goals"             element={<Goals />} />
      <Route path="/tasks"             element={<Tasks />} />
      <Route path="/study"             element={<Study />} />
      <Route path="/study/courses"     element={<Courses />} />
      <Route path="/study/assignments" element={<Assignments />} />
      <Route path="/study/exams"       element={<ExamCountdown />} />
      <Route path="/study/sessions"    element={<StudySessions />} />
      <Route path="/spiritual"         element={<Spiritual />} />
      <Route path="/projects"          element={<Projects />} />
      <Route path="/projects/:projectId" element={<Projects />} />
      <Route path="/timer"             element={<Timer />} />
      <Route path="/analytics"         element={<Analytics />} />
      <Route path="/settings"          element={<Settings />} />
      <Route path="*"                  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ---- Sub-components ----

function NavSection({ label, children }) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarLink({ to, label, icon: Icon }) {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-white'
          : 'text-cyan-100/60 hover:bg-white/[0.05] hover:text-white'
      }`}
    >
      {/* Active indicator bar */}
      <span
        className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-cyan-400 transition-all duration-250 ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <Icon size={16} strokeWidth={active ? 2 : 1.6} className={active ? 'text-cyan-300' : ''} />
      <span>{label}</span>
    </Link>
  );
}

function BottomTab({ tab }) {
  const location = useLocation();
  const active = location.pathname === tab.to || location.pathname.startsWith(tab.to + '/');
  const Icon = tab.icon;

  return (
    <Link
      to={tab.to}
      className="group relative flex flex-1 flex-col items-center justify-center gap-1 transition-all active:scale-90"
    >
      <span
        className={`flex h-8 w-14 items-center justify-center rounded-full transition-all duration-250 ${
          active ? 'bg-cyan-500/25' : 'bg-transparent group-active:bg-white/10'
        }`}
      >
        <Icon size={20} strokeWidth={active ? 2.1 : 1.7} className={active ? 'text-cyan-300' : 'text-white/55'} />
      </span>
      <span className={`text-[10px] leading-none ${active ? 'font-bold text-cyan-300' : 'font-medium text-white/55'}`}>
        {tab.label}
      </span>
    </Link>
  );
}

function MoreItem({ item, onClose }) {
  const Icon = item.icon;
  const location = useLocation();
  const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');

  return (
    <Link
      to={item.to}
      onClick={onClose}
      className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all active:scale-95 ${
        active ? 'border-cyan-400/40 bg-accent-soft' : 'border-line bg-surface'
      }`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <span className="text-[11px] font-semibold text-ink">{item.label}</span>
    </Link>
  );
}

export default App;
