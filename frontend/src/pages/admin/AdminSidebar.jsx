import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Building2, Users, ClipboardList, Wrench, Settings } from 'lucide-react';

const navItems = [
  { to: '/admin/home', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/assets', label: 'Assets', icon: Package },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/employees', label: 'Employees', icon: Users },
  { to: '/admin/allocations', label: 'Allocations', icon: ClipboardList },
  { to: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const AdminSidebar = ({ isMobileOpen, isDesktopCollapsed, closeMobile }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={closeMobile} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[var(--bg-surface)] border-r border-[var(--border-light)] flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
          md:relative md:translate-x-0
          ${isDesktopCollapsed ? 'md:w-[72px]' : 'md:w-64'}
        `}
      >
        <div className="h-16 flex items-center gap-3 border-b border-[var(--border-light)] shrink-0 px-5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-purple-400 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">AF</span>
          </div>
          <span className={`font-bold text-lg text-[var(--text-main)] whitespace-nowrap transition-all duration-300 ${isDesktopCollapsed && !isMobileOpen ? 'opacity-0 w-0' : 'opacity-100'}`}>
            AssetFlow
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={closeMobile}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 overflow-hidden
                      ${isActive(item.to)
                        ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-semibold'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)]'
                      }
                    `}
                  >
                    {isActive(item.to) && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--brand-primary)] animate-[scaleY_0.2s_ease-out]" />
                    )}
                    <span className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive(item.to) ? 'text-[var(--brand-primary)]' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className={`whitespace-nowrap text-sm transition-all duration-300 ${isDesktopCollapsed && !isMobileOpen ? 'opacity-0 w-0' : 'opacity-100'}`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-[var(--border-light)]">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-surface-hover)] transition-all duration-300 ${isDesktopCollapsed && !isMobileOpen ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-purple-400 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div className={`transition-all duration-300 overflow-hidden ${isDesktopCollapsed && !isMobileOpen ? 'w-0 opacity-0' : 'opacity-100'}`}>
              <p className="text-xs font-semibold text-[var(--text-main)] truncate">Admin</p>
              <p className="text-[10px] text-[var(--text-muted)]">Administrator</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;