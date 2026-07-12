import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeGuard({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'employee') {
    return <Navigate to="/" replace />;
  }
  return children;
}
