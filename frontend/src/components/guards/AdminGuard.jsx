import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminGuard({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    if (user.role === 'MANAGER') return <Navigate to="/manager" replace />;
    return <Navigate to="/employee" replace />;
  }

  return children;
}
