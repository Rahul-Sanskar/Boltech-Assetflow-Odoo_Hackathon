import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/global/Login";
import Register from "./pages/global/Register";
import AdminHome from "./pages/admin/AdminHome";
import ManagerHome from "./pages/manager/ManagerHome";
import EmployeeHome from "./pages/employee/EmployeeHome";

import AdminGuard from "./components/guards/AdminGuard";
import ManagerGuard from "./components/guards/ManagerGuard";
import EmployeeGuard from "./components/guards/EmployeeGuard";
import PublicGuard from "./components/guards/PublicGuard";

import AdminLayout from "./components/layouts/AdminLayout";
import ManagerLayout from "./components/layouts/ManagerLayout";
import EmployeeLayout from "./components/layouts/EmployeeLayout";

const roleHome = (role) => {
  if (role === "ADMIN") return "/admin";
  if (role === "MANAGER") return "/manager";
  return "/employee";
};

const RootRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHome(user.role)} replace />;
};

const App = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/login"
        element={
          <PublicGuard>
            <Login />
          </PublicGuard>
        }
      />
      <Route
        path="/register"
        element={
          <PublicGuard>
            <Register />
          </PublicGuard>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<AdminHome />} />
      </Route>

      <Route
        path="/manager"
        element={
          <ManagerGuard>
            <ManagerLayout />
          </ManagerGuard>
        }
      >
        <Route index element={<ManagerHome />} />
      </Route>

      <Route
        path="/employee"
        element={
          <EmployeeGuard>
            <EmployeeLayout />
          </EmployeeGuard>
        }
      >
        <Route index element={<EmployeeHome />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
