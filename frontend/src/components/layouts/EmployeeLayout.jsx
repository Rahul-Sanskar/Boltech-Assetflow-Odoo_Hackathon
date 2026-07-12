import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import EmployeeNavbar from '../../pages/employee/EmployeeNavbar';
import EmployeeSidebar from '../../pages/employee/EmployeeSidebar';

const EmployeeLayout = () => {
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
    <div className="flex h-screen bg-[var(--bg-base)] text-[var(--text-main)] overflow-hidden">
      <EmployeeSidebar 
        isMobileOpen={isMobileOpen} 
        isDesktopCollapsed={isDesktopCollapsed} 
        closeMobile={() => setIsMobileOpen(false)} 
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <EmployeeNavbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;