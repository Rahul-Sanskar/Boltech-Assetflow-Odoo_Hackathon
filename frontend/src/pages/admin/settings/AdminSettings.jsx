import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Sun, Moon } from 'lucide-react';

const AdminSettings = () => {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    const newTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    setIsDark(newTheme === 'dark');
  };

  return (
    <div className="max-w-2xl space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">Settings</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Manage your preferences</p>
      </div>

      <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-light)]">
          <h2 className="text-base font-semibold text-[var(--text-main)]">Profile</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-400 flex items-center justify-center text-white font-bold text-xl">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="font-semibold text-[var(--text-main)]">{user?.name}</p>
              <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
              <p className="text-xs text-[var(--text-muted)] capitalize mt-0.5">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-light)]">
          <h2 className="text-base font-semibold text-[var(--text-main)]">Appearance</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--bg-surface-hover)] text-[var(--text-muted)]">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-main)]">Dark Mode</p>
                <p className="text-xs text-[var(--text-muted)]">Switch between light and dark theme</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${isDark ? 'bg-[var(--brand-primary)]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-light)]">
          <h2 className="text-base font-semibold text-[var(--text-main)]">System</h2>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[var(--text-muted)]">Version</span>
            <span className="text-sm font-medium text-[var(--text-main)]">1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[var(--text-muted)]">Backend</span>
            <span className="text-sm font-medium text-emerald-600">Connected</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[var(--text-muted)]">Environment</span>
            <span className="text-sm font-medium text-[var(--text-main)]">Development</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
