import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminGuard({ children }) {
  const { user } = useAuth();

  // Is anyone logged in at all? If not, kick them to the login page.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Is the logged-in person just a regular user? If yes, kick them to the User Home page.
  if (user.role !== 'admin') {
    return <Navigate to="/user/crime-map" replace />;
  }
  // They passed the checks! Render the Admin page.
  return children;
}