import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ManagerGuard({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'MANAGER') {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/employee" replace />;
  }

  return children;
}
