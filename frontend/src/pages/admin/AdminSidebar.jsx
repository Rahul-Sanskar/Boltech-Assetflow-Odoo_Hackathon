import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = ({ isMobileOpen, isDesktopCollapsed, closeMobile }) => {
  const location = useLocation();

  // Helper to check active link
  const isActive = (path) => location.pathname === path;

  // Reusable NavItem component to keep code clean
  const NavItem = ({ to, iconPath, label }) => (
    <li>
      <Link
        to={to}
        onClick={closeMobile} // Closes mobile menu when link is clicked
        className={`flex items-center px-4 py-3 rounded-lg transition-colors group relative
          ${isActive(to) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
        `}
      >
        <svg 
          className={`w-6 h-6 flex-shrink-0 ${isActive(to) ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-900'}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>

        {/* Label - fades out when collapsed on desktop */}
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
      {/* Mobile Backdrop - only visible on small screens when sidebar is open */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity"
          onClick={closeMobile}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'} 
          md:relative md:translate-x-0 
          ${isDesktopCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* Branding Header */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 shrink-0">
          <span className="font-bold text-xl text-blue-700 truncate px-4">
            {isDesktopCollapsed && !isMobileOpen ? 'AD' : 'ChronosDesk'}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          <ul className="space-y-1">
            <NavItem 
              to="/admin" 
              label="Dashboard" 
              iconPath="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
            />
            <NavItem 
              to="/admin/departments" 
              label="Departments" 
              iconPath="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
            />
            <NavItem 
              to="/admin/users" 
              label="Users & Employees" 
              iconPath="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
            />
            <NavItem 
              to="/admin/settings" 
              label="Settings" 
              iconPath="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;