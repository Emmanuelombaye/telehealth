import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router';
import { useAuthStore, Role } from '../../lib/auth-store';

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { user, role, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        const path = window.location.pathname;
        if (path.startsWith('/doctor')) navigate('/doctor/login', { replace: true });
        else if (path.startsWith('/admin')) navigate('/admin/login', { replace: true });
        else if (path.startsWith('/superadmin')) navigate('/superadmin/login', { replace: true });
        else navigate('/patient/login', { replace: true });
      } else if (allowedRoles && role && !allowedRoles.includes(role)) {
        // User is logged in but doesn't have the right role
        // Redirect them to their proper dashboard
        switch (role) {
          case 'doctor': navigate('/doctor', { replace: true }); break;
          case 'brand_admin': navigate('/admin', { replace: true }); break;
          case 'super_admin': navigate('/superadmin', { replace: true }); break;
          case 'patient':
          default: navigate('/patient', { replace: true }); break;
        }
      }
    }
  }, [user, role, isLoading, navigate, allowedRoles]);

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  // If user exists and role is allowed, render the nested routes
  return user && (!allowedRoles || allowedRoles.includes(role)) ? <Outlet /> : null;
}
