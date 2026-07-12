import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Sun, Moon, Bell, LogOut } from 'lucide-react';

const ManagerNavbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    const newTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    setIsDark(newTheme === 'dark');
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

        <button className="relative p-2.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)] transition-all duration-200 active:scale-90">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </button>

        <div className="w-px h-8 bg-[var(--border-light)] mx-1" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[var(--text-main)]">{user?.name || 'Manager'}</p>
            <p className="text-[11px] text-[var(--text-muted)] capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200 active:scale-90"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default ManagerNavbar;