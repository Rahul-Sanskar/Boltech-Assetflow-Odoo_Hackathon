import { Link, useLocation } from 'react-router-dom';

const ManagerSidebar = ({ isMobileOpen, isDesktopCollapsed, closeMobile }) => {
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
            <NavItem to="/manager/home" label="Dashboard" iconPath="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            <NavItem to="/manager/team" label="My Department" iconPath="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            <NavItem to="/manager/approvals" label="Approvals" iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default ManagerSidebar;