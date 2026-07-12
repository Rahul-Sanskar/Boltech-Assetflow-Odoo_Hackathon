import { Link, useLocation } from 'react-router-dom';

const EmployeeSidebar = ({ isMobileOpen, isDesktopCollapsed, closeMobile }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const NavItem = ({ to, iconPath, label }) => (
    <li>
      <Link
        to={to}
        onClick={closeMobile}
        className={`flex items-center px-4 py-3 rounded-lg transition-colors group relative
          ${isActive(to) ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)]'}
        `}
      >
        <svg 
          className={`w-6 h-6 flex-shrink-0 ${isActive(to) ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
        <span 
          className={`ml-3 whitespace-nowrap transition-opacity duration-200
            ${isDesktopCollapsed && !isMobileOpen ? 'opacity-0 md:hidden' : 'opacity-100 block'}
          `}
        >
          {label}
        </span>
      </Link>
    </li>
  );

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" onClick={closeMobile}></div>
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[var(--bg-surface)] border-r border-[var(--border-light)] flex flex-col transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'} 
          md:relative md:translate-x-0 
          ${isDesktopCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        <div className="h-16 flex items-center justify-center border-b border-[var(--border-light)] shrink-0">
          <span className="font-bold text-xl text-[var(--brand-primary)] truncate px-4">
            {isDesktopCollapsed && !isMobileOpen ? 'CD' : 'ChronosDesk'}
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          <ul className="space-y-1">
            <NavItem to="/employee/home" label="Dashboard" iconPath="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            <NavItem to="/employee/my-assets" label="My Assets" iconPath="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            <NavItem to="/employee/maintenance" label="Maintenance" iconPath="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            <NavItem to="/employee/booking" label="Booking" iconPath="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default EmployeeSidebar;