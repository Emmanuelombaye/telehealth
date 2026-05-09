import { useEffect, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router';
import { useAuthStore, Role } from '../../lib/auth-store';

const portalLoginUrl = (path: string) => {
  if (path.startsWith('/doctor')) return '/doctor/login';
  if (path.startsWith('/admin')) return '/admin/login';
  if (path.startsWith('/superadmin')) return '/superadmin/login';
  return '/patient/login';
};

function AuthLoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center gap-6 z-50">
      <img src="/originallogo.png" alt="Peak Health" className="h-14 object-contain opacity-90" />
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
        <span className="text-white/50 text-sm font-medium tracking-wide">Verifying credentials...</span>
      </div>
    </div>
  );
}

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { user, role, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    if (isLoading || redirected.current) return;

    if (!user) {
      redirected.current = true;
      navigate(portalLoginUrl(window.location.pathname), { replace: true });
      return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      redirected.current = true;
      // Arranging Access: Redirect to the user's appropriate portal instead of showing 404
      const targetPortal = 
        role === 'doctor' ? '/doctor' : 
        (role === 'brand_admin' || role === 'super_admin') ? '/admin' : 
        role === 'super_admin' ? '/superadmin' :
        '/patient';
      
      console.log(`[ProtectedRoute] Role ${role} not allowed on ${window.location.pathname}. Redirecting to ${targetPortal}`);
      navigate(targetPortal, { replace: true });
    }
  }, [user, role, isLoading, navigate, allowedRoles]);

  // Show branded loading screen while auth is resolving
  if (isLoading) return <AuthLoadingScreen />;

  // Not logged in — show nothing while redirect fires
  if (!user) return <AuthLoadingScreen />;

  // Logged in but wrong role — show nothing while redirect fires
  if (allowedRoles && role && !allowedRoles.includes(role)) return <AuthLoadingScreen />;

  // ✅ Authenticated + correct role — render the portal
  return <Outlet />;
}
