import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

//global
import Login from "./pages/global/Login";
import Register from "./pages/global/Register";

//admin
import AdminHome from "./pages/admin/AdminHome";

//manager
import ManagerHome from "./pages/manager/ManagerHome";

//employee
import EmployeeHome from "./pages/employee/EmployeeHome";
import AdminGuard from "./components/guards/AdminGuard";

const RootRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/user/crime-map" replace />;
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
      {/* root */}
      <Route path="/" element={<RootRedirect/>} />
      {/* public */}
      <Route path="/login" element={<PublicGuard><Login/></PublicGuard>} />
      <Route path="/register" element={<PublicGuard><Register/></PublicGuard>} />
      {/* admin */}
      <Route path="/admin" element={<AdminGuard><AdminLayout/></AdminGuard>}></Route>
      {/* manager */}
      {/* employee */}
    </Routes>
  );
};

export default App;
