import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ManagerGuard({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'manager') {
    return <Navigate to="/manager/home" replace />;
  }
  return children;
}