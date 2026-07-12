import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import AdminGuard from "./components/guards/AdminGuard";
import PublicGuard from "./components/guards/PublicGuard";
import EmployeeGuard from "./components/guards/EmployeeGuard";
import ManagerGuard from "./components/guards/ManagerGuard";

import AdminLayout from "./components/layouts/AdminLayout";
import EmployeeLayout from "./components/layouts/EmployeeLayout";
import ManagerLayout from "./components/layouts/ManagerLayout";

import Login from "./pages/global/Login";
import Register from "./pages/global/Register";

import AdminHome from "./pages/admin/AdminHome";
import AssetList from "./pages/admin/assets/AssetList";
import DepartmentList from "./pages/admin/departments/DepartmentList";
import EmployeeList from "./pages/admin/employees/EmployeeList";
import AllocationList from "./pages/admin/allocations/AllocationList";
import MaintenanceList from "./pages/admin/maintenance/MaintenanceList";
import AdminSettings from "./pages/admin/settings/AdminSettings";

import ManagerHome from "./pages/manager/ManagerHome";
import EmployeeHome from "./pages/employee/EmployeeHome";

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin/home" replace />;
  if (user.role === "manager") return <Navigate to="/manager/home" replace />;
  return <Navigate to="/employee/home" replace />;
};

const App = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route path="/login" element={<PublicGuard><Login /></PublicGuard>} />
      <Route path="/register" element={<PublicGuard><Register /></PublicGuard>} />

      <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
        <Route path="home" element={<AdminHome />} />
        <Route path="assets" element={<AssetList />} />
        <Route path="departments" element={<DepartmentList />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="allocations" element={<AllocationList />} />
        <Route path="maintenance" element={<MaintenanceList />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="/manager" element={<ManagerGuard><ManagerLayout /></ManagerGuard>}>
        <Route path="home" element={<ManagerHome />} />
      </Route>

      <Route path="/employee" element={<EmployeeGuard><EmployeeLayout /></EmployeeGuard>}>
        <Route path="home" element={<EmployeeHome />} />
      </Route>
    </Routes>
  );
};

export default App;
