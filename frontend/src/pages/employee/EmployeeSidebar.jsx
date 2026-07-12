import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Calendar, 
  Wrench, 
  Bell, 
  LogOut, 
  Boxes,
  X 
} from 'lucide-react';

export default function EmployeeSidebar({ isMobileOpen, isDesktopCollapsed, closeMobile }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/employee/home', icon: LayoutDashboard },
    { name: 'My Assets', path: '/employee/my-assets', icon: Package },
    { name: 'Bookings', path: '/employee/bookings', icon: Calendar },
    { name: 'Maintenance', path: '/employee/maintenance', icon: Wrench },
    { name: 'Notifications', path: '/employee/notifications', icon: Bell },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-[fadeIn_0.2s_ease-out]"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        h-full flex flex-col justify-between 
        bg-[var(--bg-surface)] border-r border-[var(--border-light)] 
        p-4 select-none shrink-0 
        transition-all duration-300 ease-in-out
        ${isDesktopCollapsed ? 'md:w-20' : 'md:w-64'}
        ${isMobileOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Top Section */}
        <div className="flex flex-col gap-6">
          {/* Brand Logo & Mobile Close Trigger */}
          <div className="flex items-center justify-between px-1 py-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 rounded-xl bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-sm shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              {(!isDesktopCollapsed || isMobileOpen) && (
                <div className="truncate">
                  <h1 className="text-base font-bold tracking-tight leading-none">AssetFlow</h1>
                  <span className="text-[10px] font-mono font-medium text-[var(--text-muted)] tracking-wider uppercase">Employee Portal</span>
                </div>
              )}
            </div>
            <button
              onClick={closeMobile}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] md:hidden transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobile}
                  title={isDesktopCollapsed && !isMobileOpen ? item.name : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isDesktopCollapsed && !isMobileOpen ? 'md:justify-center md:px-0 px-3.5' : 'px-3.5'
                    } ${
                      isActive
                        ? 'bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-sm font-semibold'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {(!isDesktopCollapsed || isMobileOpen) && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Logout Option */}
        <div className="pt-4 border-t border-[var(--border-light)]">
          <button
            onClick={() => {
              handleLogout();
              closeMobile();
            }}
            title={isDesktopCollapsed && !isMobileOpen ? "Logout" : undefined}
            className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-xs font-medium text-[var(--status-danger)] hover:bg-rose-500/10 transition-colors ${
              isDesktopCollapsed && !isMobileOpen ? 'md:justify-center md:px-0 px-3.5' : 'px-3.5'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(!isDesktopCollapsed || isMobileOpen) && <span>Logout</span>}
          </button>
        </div>

      </aside>
    </>
  );
}