import { useAuth } from '../../context/AuthContext';

const AdminNavbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10 shrink-0">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {/* Hamburger Icon */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-gray-700">{user?.name || 'Admin'}</span>
          <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
        </div>
        <button
          onClick={logout}
          className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-md hover:bg-red-100 transition-colors font-medium"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default AdminNavbar;