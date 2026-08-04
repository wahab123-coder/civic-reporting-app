import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

interface Props {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
    // Redirect to correct area based on role
    if (user.role === 'admin' || user.role === 'government_officer') {
      return <Navigate to="/gov/dashboard" replace />;
    }
    return <Navigate to="/citizen/home" replace />;
  }

  return <Outlet />;
}
