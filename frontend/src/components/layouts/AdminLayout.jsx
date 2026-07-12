import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from '../../pages/admin/AdminNavbar';
import AdminSidebar from '../../pages/admin/AdminSidebar';

const AdminLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  // Close mobile sidebar automatically when window resizes to desktop view
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
      // Mobile behavior: toggle visibility
      setIsMobileOpen(!isMobileOpen);
    } else {
      // Desktop behavior: toggle mini/full width
      setIsDesktopCollapsed(!isDesktopCollapsed);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Component */}
      <AdminSidebar 
        isMobileOpen={isMobileOpen} 
        isDesktopCollapsed={isDesktopCollapsed} 
        closeMobile={() => setIsMobileOpen(false)} 
      />
      
      {/* Main Content Area (Takes remaining width) */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminNavbar toggleSidebar={toggleSidebar} />
        
        {/* Scrollable page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;