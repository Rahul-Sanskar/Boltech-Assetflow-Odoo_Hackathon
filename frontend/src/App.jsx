import React, { useEffect } from "react";
import FloatingChat from "./components/FloatingChat.jsx";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

//guards
import AdminGuard from "./components/guards/AdminGuard";
import PublicGuard from "./components/guards/PublicGuard";
import EmployeeGuard from "./components/guards/EmployeeGuard";
import ManagerGuard from "./components/guards/ManagerGuard";

//layouts
import AdminLayout from "./components/layouts/AdminLayout"
import EmployeeLayout from "./components/layouts/EmployeeLayout"
import ManagerLayout from "./components/layouts/ManagerLayout"

//global
import Login from "./pages/global/Login";
import Register from "./pages/global/Register";

//admin
import AdminHome from "./pages/admin/AdminHome";
import AdminAssets from "./pages/admin/Assets";
import AdminAudit from "./pages/admin/Audit";
import AdminReports from "./pages/admin/Reports";

//manager
import ManagerHome from "./pages/manager/ManagerHome";

//employee
import EmployeeHome from "./pages/employee/EmployeeHome";

//shared
import Maintenance from "./pages/shared/Maintenance";
import Booking from "./pages/shared/Booking";

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
    }
  }, []);

  return (
    <>
      <Routes>
        {/* root */}
        <Route path="/" element={<RootRedirect/>} />

        {/* public */}
        <Route path="/login" element={<PublicGuard><Login/></PublicGuard>} />
        <Route path="/register" element={<PublicGuard><Register/></PublicGuard>} />

        {/* admin */}
        <Route path="/admin" element={<AdminGuard><AdminLayout/></AdminGuard>}>
          <Route path="home" element={<AdminHome/>} />
          <Route path="assets" element={<AdminAssets/>} />
          <Route path="audit" element={<AdminAudit/>} />
          <Route path="reports" element={<AdminReports/>} />
          <Route path="maintenance" element={<Maintenance/>} />
          <Route path="booking" element={<Booking/>} />
        </Route>

        {/* manager */}
        <Route path="/manager" element={<ManagerGuard><ManagerLayout/></ManagerGuard>}>
          <Route path="home" element={<ManagerHome/>} />
          <Route path="maintenance" element={<Maintenance/>} />
          <Route path="booking" element={<Booking/>} />
        </Route>
        {/* employee */}
        <Route path="/employee" element={<EmployeeGuard><EmployeeLayout/></EmployeeGuard>}>
          <Route path="home" element={<EmployeeHome/>} />
          <Route path="maintenance" element={<Maintenance/>} />
          <Route path="booking" element={<Booking/>} />
        </Route>
      </Routes>
      <FloatingChat />
    </>
  );
};

export default App;
