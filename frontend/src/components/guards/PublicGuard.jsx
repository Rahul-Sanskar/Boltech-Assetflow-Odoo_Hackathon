import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PublicGuard({ children }) {
  const { user } = useAuth();
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/home" replace />;
    }
    if(user.role === 'manager'){
      return <Navigate to="/admin/home" replace />;
    }
    return <Navigate to="/employee/home" replace />;
  }
  return children;
}