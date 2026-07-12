import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PublicGuard({ children }) {
  const { user } = useAuth();

  // If someone is already logged in, redirect them based on their role
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/user/crime-map" replace />;
  }

  // If they are NOT logged in, let them see the login/register page
  return children;
}