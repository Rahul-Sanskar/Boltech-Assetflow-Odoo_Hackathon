import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function UserGuard({ children }) {
  const { user } = useAuth();

  // Is anyone logged in at all?
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // Is the logged-in person an Admin? If yes, kick them back to their Admin Dashboard.
  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  // They are a standard user. Render the User page.
  return children;
}