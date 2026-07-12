import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';

const NAV = [{ to: '/manager/home', label: 'Dashboard', icon: LayoutDashboard }];

const ManagerSidebar = ({ isMobileOpen, isDesktopCollapsed, closeMobile }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobile} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[var(--bg-surface)] border-r border-[var(--border-light)] flex flex-col transition-all duration-300
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
          md:relative md:translate-x-0
          ${isDesktopCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        <div className="h-16 flex items-center justify-center border-b border-[var(--border-light)] shrink-0">
          <span className="font-bold text-xl text-[var(--brand-primary)] truncate px-4">
            {isDesktopCollapsed && !isMobileOpen ? 'AF' : 'AssetFlow'}
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={closeMobile}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors
                    ${isActive(to) ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]'}`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className={`ml-3 whitespace-nowrap ${isDesktopCollapsed && !isMobileOpen ? 'opacity-0 md:hidden' : ''}`}>
                    {label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default ManagerSidebar;
