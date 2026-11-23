import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PageLoader from './PageLoader.jsx';

export default function ProtectedRoute({ children, admin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Checking your session" />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (admin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
