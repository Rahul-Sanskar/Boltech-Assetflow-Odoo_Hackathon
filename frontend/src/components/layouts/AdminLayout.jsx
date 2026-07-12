import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from '../../pages/admin/AdminNavbar';
import AdminSidebar from '../../pages/admin/AdminSidebar';
import Breadcrumbs from '../ui/Breadcrumbs';
import { NotificationProvider } from '../../context/NotificationContext';

const AdminLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsDesktopCollapsed(!isDesktopCollapsed);
    }
  };

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden transition-colors duration-300">
        <AdminSidebar
          isMobileOpen={isMobileOpen}
          isDesktopCollapsed={isDesktopCollapsed}
          closeMobile={() => setIsMobileOpen(false)}
        />

        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <AdminNavbar toggleSidebar={toggleSidebar} />

          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
            <Breadcrumbs />
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
};

export default AdminLayout;
