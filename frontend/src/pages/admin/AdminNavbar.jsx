import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, Sun, Moon, LogOut, Settings, User } from 'lucide-react';
import NotificationBell from '../../components/ui/NotificationBell';
import GlobalSearch from '../../components/ui/GlobalSearch';

const AdminNavbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!profileOpen) return undefined;
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [profileOpen]);

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
            fill: 'both',
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
            fill: 'both',
          }
        );
      }
    });
  };

  const initials = (user?.name || 'A').charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-[var(--bg-surface)]/80 backdrop-blur-xl border-b border-[var(--border-light)] flex items-center justify-between gap-3 px-5 z-10 shrink-0 sticky top-0 transition-colors duration-300">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)] transition-all duration-200 active:scale-90 shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)] transition-all duration-200 active:scale-90"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="mr-1">
          <NotificationBell />
        </div>

        <div className="w-px h-8 bg-[var(--border-light)] mx-2" />

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-3 pl-1 cursor-pointer hover:opacity-80 transition-opacity outline-none"
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[var(--text-main)] leading-tight">{user?.name || 'Admin'}</p>
              <p className="text-[11px] font-medium text-[var(--brand-primary)] capitalize">{user?.role || 'Admin'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-hover)] flex items-center justify-center shrink-0 shadow-sm border-2 border-[var(--bg-surface)]">
              <span className="text-[var(--text-inverse)] text-sm font-bold">{initials}</span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-xl z-50 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
              <div className="px-4 py-3 border-b border-[var(--border-light)]">
                <p className="text-sm font-semibold text-[var(--text-main)] truncate">{user?.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  to="/admin/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]"
                >
                  <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                  Settings
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]"
                >
                  <User className="w-4 h-4 text-[var(--text-muted)]" />
                  Users
                </Link>
              </div>
              <div className="border-t border-[var(--border-light)] py-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;