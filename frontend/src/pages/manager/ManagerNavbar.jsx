import { useAuth } from '../../context/AuthContext';

const ManagerNavbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-[var(--bg-surface)] border-b border-[var(--border-light)] flex items-center justify-between px-4 z-10 shrink-0 transition-colors">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] focus:outline-none transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium">{user?.name || 'Manager'}</span>
          <span className="text-xs text-[var(--text-muted)] capitalize">{user?.role}</span>
        </div>
        <button
          onClick={logout}
          className="text-sm bg-[var(--status-danger)]/10 text-[var(--status-danger)] px-4 py-2 rounded-md hover:bg-[var(--status-danger)]/20 transition-colors font-medium"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default ManagerNavbar;