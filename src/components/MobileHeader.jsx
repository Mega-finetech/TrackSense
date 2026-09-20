import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell } from 'lucide-react';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/goals': 'Goals',
  '/tasks': 'Tasks',
  '/study': 'Academic',
  '/study/courses': 'Courses',
  '/study/assignments': 'Assignments',
  '/study/exams': 'Exams',
  '/study/sessions': 'Study Sessions',
  '/spiritual': 'Spiritual',
  '/projects': 'Projects',
  '/timer': 'Focus Timer',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

const ROOT_ROUTES = ['/dashboard', '/goals', '/tasks', '/spiritual', '/timer', '/projects', '/analytics', '/settings'];

export default function MobileHeader({ onNotificationClick, notificationCount = 0 }) {
  const location = useLocation();
  const navigate = useNavigate();
  const lastScrollY = useRef(0);
  const [hidden, setHidden] = useState(false);

  const title = PAGE_TITLES[location.pathname] ?? 'TrackSense';
  const isRoot = ROOT_ROUTES.includes(location.pathname);

  // Hide header on scroll down, show on scroll up
  useEffect(() => {
    const main = document.getElementById('mobile-main-content');
    if (!main) return;

    const handleScroll = () => {
      const currentY = main.scrollTop;
      setHidden(currentY > lastScrollY.current && currentY > 60);
      lastScrollY.current = currentY;
    };

    main.addEventListener('scroll', handleScroll, { passive: true });
    return () => main.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  // Reset on route change
  useEffect(() => {
    setHidden(false);
    lastScrollY.current = 0;
  }, [location.pathname]);

  return (
    <header
      className="glass sticky top-0 z-30 flex-shrink-0 border-b border-line transition-transform duration-300 ease-out"
      style={{
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Back or Logo */}
        {!isRoot ? (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors active:bg-card-muted"
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>
        ) : (
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/tracksenselogo.png" alt="TrackSense" className="h-7 w-auto" />
          </Link>
        )}

        {/* Center: Title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-bold tracking-tight text-ink">
          {isRoot ? 'TrackSense' : title}
        </h1>

        {/* Right: Notification Bell */}
        <button
          onClick={onNotificationClick}
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors active:bg-card-muted"
        >
          <Bell size={20} strokeWidth={1.8} />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 px-1 text-[9px] font-bold text-white shadow-glow">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
