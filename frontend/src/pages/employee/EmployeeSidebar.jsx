import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Calendar,
  Wrench,
  Bell,
  LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/employee/home', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employee/my-assets', label: 'My Assets', icon: Package },
  { to: '/employee/bookings', label: 'Bookings', icon: Calendar },
  { to: '/employee/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/employee/notifications', label: 'Notifications', icon: Bell },
];

const EmployeeSidebar = ({ isMobileOpen, isDesktopCollapsed, closeMobile }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-xl
          bg-[var(--brand-primary)] dark:bg-[var(--bg-surface)] 
          border-r border-transparent dark:border-[var(--border-light)]
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
          md:relative md:translate-x-0
          ${isDesktopCollapsed ? 'md:w-[72px]' : 'md:w-64'}
        `}
      >
        <div className="h-16 flex items-center border-b border-black/10 dark:border-[var(--border-light)] shrink-0 relative overflow-hidden transition-colors">
          
          {/* LOGO: Centered, visible ONLY when collapsed */}
          <div className={`absolute left-1/2 -translate-x-1/2 rounded-lg bg-[var(--text-inverse)] dark:bg-[var(--brand-primary)] flex items-center justify-center shadow-sm transition-all duration-300 ${isDesktopCollapsed && !isMobileOpen ? 'w-8 h-8 opacity-100 scale-100' : 'w-8 h-8 opacity-0 scale-50 pointer-events-none'}`}>
            <span className="text-[var(--brand-primary)] dark:text-[var(--text-inverse)] font-black text-sm tracking-tighter">AF</span>
          </div>

          {/* TEXT: Left aligned, visible ONLY when expanded */}
          <div className={`absolute left-5 flex items-center transition-all duration-300 ${isDesktopCollapsed && !isMobileOpen ? 'opacity-0 -translate-x-4 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
            <span className="font-jakarta font-extrabold text-3xl text-white ">Asset</span>
            <span className="font-jakarta font-extrabold text-3xl text-blue-400 ">Flow</span>
          </div>

        </div>

        {/* Changed to md:overflow-visible so tooltips don't clip on desktop */}
        <nav className="flex-1 py-4 px-3 custom-scrollbar overflow-y-auto md:overflow-visible">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to} className="relative group/item">
                  <Link
                    to={item.to}
                    onClick={closeMobile}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                      ${isActive(item.to)
                        ? 'bg-white/20 dark:bg-[var(--brand-primary)]/10 text-[var(--text-inverse)] dark:text-[var(--brand-primary)] font-semibold shadow-inner dark:shadow-none'
                        : 'text-white/70 dark:text-[var(--text-muted)] hover:bg-white/10 dark:hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-inverse)] dark:hover:text-[var(--text-main)]'
                      }
                    `}
                  >
                    {isActive(item.to) && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[var(--text-inverse)] dark:bg-[var(--brand-primary)] shadow-[0_0_8px_rgba(255,255,255,0.5)] dark:shadow-none transition-colors" />
                    )}
                    <span className={`shrink-0 transition-transform duration-200 group-hover/item:scale-110 ${isActive(item.to) ? 'text-[var(--text-inverse)] dark:text-[var(--brand-primary)]' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className={`whitespace-nowrap text-sm overflow-hidden transition-all duration-300 ${isDesktopCollapsed && !isMobileOpen ? 'opacity-0 w-0' : 'opacity-100'}`}>
                      {item.label}
                    </span>
                  </Link>

                  {/* CUSTOM INSTANT TOOLTIP */}
                  {isDesktopCollapsed && !isMobileOpen && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900 dark:bg-[#221D3D] border border-transparent dark:border-[var(--border-light)] text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 z-[999] shadow-xl whitespace-nowrap pointer-events-none">
                      {item.label}
                      {/* Tooltip Triangle Pointer */}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900 dark:border-r-[#221D3D]" />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-black/10 dark:border-[var(--border-light)] transition-colors relative group/logout">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 
              text-white/80 dark:text-[var(--status-danger)] 
              hover:bg-rose-500/80 dark:hover:bg-rose-500/10 
              hover:text-white dark:hover:text-[var(--status-danger)] hover:shadow-md dark:hover:shadow-none
              ${isDesktopCollapsed && !isMobileOpen ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-5 h-5 shrink-0 transition-transform group-hover/logout:-translate-x-1" />
            <span className={`whitespace-nowrap font-medium text-sm overflow-hidden transition-all duration-300 ${isDesktopCollapsed && !isMobileOpen ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              Logout
            </span>
          </button>

          {/* CUSTOM LOGOUT TOOLTIP */}
          {isDesktopCollapsed && !isMobileOpen && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover/logout:opacity-100 group-hover/logout:visible transition-all duration-200 z-[999] shadow-xl whitespace-nowrap pointer-events-none">
              Logout
              {/* Tooltip Triangle Pointer */}
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-[5px] border-transparent border-r-rose-600" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default EmployeeSidebar;