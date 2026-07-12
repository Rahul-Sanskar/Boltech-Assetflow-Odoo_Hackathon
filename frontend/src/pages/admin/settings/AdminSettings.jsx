import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import API from '../../../api/API';
import PageHeader from '../../../components/ui/PageHeader';
import Badge from '../../../components/ui/Badge';
import { Sun, Moon, Monitor, RefreshCw, Trash2, Shield, Server, Database, KeyRound } from 'lucide-react';

const APP_VERSION = '1.0.0';

const AdminSettings = () => {
  const { user } = useAuth();
  const { success, info } = useToast();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [dbStatus, setDbStatus] = useState('checking');
  const [healthMessage, setHealthMessage] = useState('');

  const jwtPresent = Boolean(localStorage.getItem('token'));

  const checkHealth = () => {
    setBackendStatus('checking');
    setDbStatus('checking');
    API.get('/health')
      .then((res) => {
        setBackendStatus('connected');
        setDbStatus('connected');
        setHealthMessage(res.data?.message || 'OK');
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 500) {
          setBackendStatus('connected');
          setDbStatus('disconnected');
          setHealthMessage(err.response?.data?.message || 'Database connection failed');
        } else {
          setBackendStatus('disconnected');
          setDbStatus('unknown');
          setHealthMessage(err.message || 'Unreachable');
        }
      });
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const applyTheme = (next) => {
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (next === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      localStorage.setItem('theme', 'system');
    }
    success(`Theme set to ${next}`);
  };

  const clearCache = () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedTheme = localStorage.getItem('theme');
    localStorage.clear();
    if (token) localStorage.setItem('token', token);
    if (savedUser) localStorage.setItem('user', savedUser);
    if (savedTheme) localStorage.setItem('theme', savedTheme);
    info('Local cache cleared (session preserved)');
  };

  const refreshApp = () => {
    window.location.reload();
  };

  const Row = ({ label, children }) => (
    <div className="flex items-center justify-between py-2.5 gap-4">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <div className="text-sm font-medium text-[var(--text-main)] text-right">{children}</div>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <PageHeader title="Settings" subtitle="Account preferences and system status">
        <button
          type="button"
          onClick={checkHealth}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
        >
          <RefreshCw className="w-4 h-4" />
          Recheck
        </button>
      </PageHeader>

      <section className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-light)]">
          <h2 className="text-base font-semibold text-[var(--text-main)]">Current User</h2>
        </div>
        <div className="p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-400 flex items-center justify-center text-white font-bold text-xl">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="font-semibold text-[var(--text-main)]">{user?.name}</p>
            <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
            <p className="text-xs text-[var(--text-muted)] capitalize mt-0.5">{user?.role}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-light)]">
          <h2 className="text-base font-semibold text-[var(--text-main)]">Appearance</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-[var(--text-muted)] mb-3">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => applyTheme(id)}
                className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition-colors ${
                  theme === id
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                    : 'border-[var(--border-light)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-light)] flex items-center gap-2">
          <Server className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-base font-semibold text-[var(--text-main)]">System Status</h2>
        </div>
        <div className="p-6 divide-y divide-[var(--border-light)]">
          <Row label="Backend Status">
            {backendStatus === 'checking' && <span className="text-[var(--text-muted)]">Checking…</span>}
            {backendStatus === 'connected' && <Badge variant="success">Online</Badge>}
            {backendStatus === 'disconnected' && <Badge variant="danger">Offline</Badge>}
          </Row>
          <Row label="Database Status">
            {dbStatus === 'checking' && <span className="text-[var(--text-muted)]">Checking…</span>}
            {dbStatus === 'connected' && <Badge variant="success">Connected</Badge>}
            {dbStatus === 'disconnected' && <Badge variant="danger">Unavailable</Badge>}
            {dbStatus === 'unknown' && <Badge variant="default">Unknown</Badge>}
          </Row>
          <Row label="Health Message">
            <span className="text-xs text-[var(--text-muted)] max-w-[240px]">{healthMessage || '—'}</span>
          </Row>
          <Row label="API Base URL">
            <span className="text-xs font-mono truncate max-w-[240px]">
              {import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}
            </span>
          </Row>
          <Row label="API Version">
            <span className="text-[var(--text-muted)] text-xs">Not published by backend</span>
          </Row>
          <Row label="Environment">
            <Badge variant="info">{import.meta.env.MODE}</Badge>
          </Row>
          <Row label="Application Version">{APP_VERSION}</Row>
          <Row label="JWT Status">
            {jwtPresent ? (
              <span className="inline-flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <Badge variant="success">Present</Badge>
              </span>
            ) : (
              <Badge variant="danger">Missing</Badge>
            )}
          </Row>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-light)] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-base font-semibold text-[var(--text-main)]">Actions</h2>
        </div>
        <div className="p-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={clearCache}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-light)] text-sm font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cache
          </button>
          <button
            type="button"
            onClick={refreshApp}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-semibold hover:bg-[var(--brand-hover)]"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Application
          </button>
        </div>
        <p className="px-6 pb-5 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          Clear Cache keeps your login session and theme preference.
        </p>
      </section>
    </div>
  );
};

export default AdminSettings;
