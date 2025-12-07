/**
 * Admin Route Component
 * Protects routes that require admin role (not accessible to regular employees)
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { EMPLOYEE_ROLES, ROUTES } from '@/config/constants';
import Loading from './Loading';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading fullScreen message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check if user is admin (super admin or regular admin)
  const isAdmin = user?.role === EMPLOYEE_ROLES.ADMIN;
  
  if (!isAdmin) {
    // Regular employees cannot access admin routes - redirect to dashboard
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  }

  return children;
};

export default AdminRoute;

