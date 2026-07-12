import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeGuard({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'EMPLOYEE') {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'MANAGER') return <Navigate to="/manager" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
