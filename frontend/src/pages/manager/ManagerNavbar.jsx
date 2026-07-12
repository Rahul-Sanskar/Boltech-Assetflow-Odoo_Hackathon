import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, Sun, Moon, Bell } from 'lucide-react';
import API from '../../api/API';

const ManagerNavbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = () => {
    API.get('/notifications')
      .then((res) => {
        const list = res.data.data || [];
        setUnreadCount(list.filter((n) => !n.isRead).length);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

const toggleTheme = (event) => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    const newTheme = isCurrentlyDark ? 'light' : 'dark';

    if (!document.startViewTransition) {
      document.documentElement.classList.toggle('dark');
      document.documentElement.style.colorScheme = newTheme;
      localStorage.setItem('theme', newTheme);
      setIsDark(newTheme === 'dark');
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      document.documentElement.classList.toggle('dark');
      document.documentElement.style.colorScheme = newTheme;
      localStorage.setItem('theme', newTheme);
      setIsDark(newTheme === 'dark');
    });

    transition.ready.then(() => {
      if (isCurrentlyDark) {
        // Dark -> Light: Outward
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 400,
            easing: 'ease-out',
            pseudoElement: '::view-transition-new(root)',
            fill: 'both', // Prevents the flash at the end
          }
        );
      } else {
        // Light -> Dark: Inward
        document.documentElement.animate(
          {
            clipPath: [
              `circle(${endRadius}px at ${x}px ${y}px)`,
              `circle(0px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 400,
            easing: 'ease-in',
            pseudoElement: '::view-transition-old(root)',
            fill: 'both', // Prevents the flash at the end
          }
        );
      }
    });
  };

  return (
    <header className="h-16 bg-[var(--bg-surface)]/80 backdrop-blur-xl border-b border-[var(--border-light)] flex items-center justify-between px-5 z-10 shrink-0 sticky top-0 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)] transition-all duration-200 active:scale-90"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)] transition-all duration-200 active:scale-90"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <Link
          to="/manager/notifications"
          className="relative p-2.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)] transition-all duration-200 active:scale-90 mr-1"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[var(--status-danger)] text-[var(--text-inverse)] text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </Link>

        <div className="w-px h-8 bg-[var(--border-light)] mx-2" />

        <div className="flex items-center gap-3 pl-1 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[var(--text-main)] leading-tight">{user?.name || 'Manager'}</p>
            <p className="text-[11px] font-medium text-[var(--brand-primary)] capitalize">{user?.role || 'Department Manager'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-hover)] flex items-center justify-center shrink-0 shadow-sm border-2 border-[var(--bg-surface)]">
            <span className="text-[var(--text-inverse)] text-sm font-bold">{user?.name?.charAt(0) || 'M'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ManagerNavbar;