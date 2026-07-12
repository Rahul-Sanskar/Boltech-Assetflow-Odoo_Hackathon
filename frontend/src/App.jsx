import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import AdminGuard from './components/guards/AdminGuard';
import PublicGuard from './components/guards/PublicGuard';
import EmployeeGuard from './components/guards/EmployeeGuard';
import ManagerGuard from './components/guards/ManagerGuard';

import AdminLayout from './components/layouts/AdminLayout';
import EmployeeLayout from './components/layouts/EmployeeLayout';
import ManagerLayout from './components/layouts/ManagerLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';

import Login from './pages/global/Login';
import Register from './pages/global/Register';
import { NotFoundPage, ForbiddenPage, UnauthorizedPage } from './pages/global/ErrorPages';

const AdminHome = lazy(() => import('./pages/admin/AdminHome'));
const AssetList = lazy(() => import('./pages/admin/assets/AssetList'));
const DepartmentList = lazy(() => import('./pages/admin/departments/DepartmentList'));
const EmployeeList = lazy(() => import('./pages/admin/employees/EmployeeList'));
const AllocationList = lazy(() => import('./pages/admin/allocations/AllocationList'));
const MaintenanceList = lazy(() => import('./pages/admin/maintenance/MaintenanceList'));
const CategoryList = lazy(() => import('./pages/admin/categories/CategoryList'));
const TransferList = lazy(() => import('./pages/admin/transfers/TransferList'));
const BookingList = lazy(() => import('./pages/admin/bookings/BookingList'));
const AdminSettings = lazy(() => import('./pages/admin/settings/AdminSettings'));
const ReportsPage = lazy(() => import('./pages/admin/reports/ReportsPage'));
const NotificationsPage = lazy(() => import('./pages/admin/notifications/NotificationsPage'));
const UserList = lazy(() => import('./pages/admin/users/UserList'));
const AuditList = lazy(() => import('./pages/admin/audits/AuditList'));
const ActivityPage = lazy(() => import('./pages/admin/activity/ActivityPage'));

const ManagerHome = lazy(() => import('./pages/manager/ManagerHome'));
const EmployeeHome = lazy(() => import('./pages/employee/EmployeeHome'));

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/home" replace />;
  if (user.role === 'manager') return <Navigate to="/manager/home" replace />;
  return <Navigate to="/employee/home" replace />;
};

const PageFallback = () => (
  <div className="py-20">
    <LoadingSpinner />
  </div>
);

const App = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route path="/login" element={<PublicGuard><Login /></PublicGuard>} />
        <Route path="/register" element={<PublicGuard><Register /></PublicGuard>} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route path="home" element={<AdminHome />} />
          <Route path="assets" element={<AssetList />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="departments" element={<DepartmentList />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="allocations" element={<AllocationList />} />
          <Route path="transfers" element={<TransferList />} />
          <Route path="bookings" element={<BookingList />} />
          <Route path="maintenance" element={<MaintenanceList />} />
          <Route path="audits" element={<AuditList />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="users" element={<UserList />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="/manager" element={<ManagerGuard><ManagerLayout /></ManagerGuard>}>
          <Route path="home" element={<ManagerHome />} />
        </Route>

        <Route path="/employee" element={<EmployeeGuard><EmployeeLayout /></EmployeeGuard>}>
          <Route path="home" element={<EmployeeHome />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default App;
