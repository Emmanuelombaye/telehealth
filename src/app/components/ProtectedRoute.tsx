import { useEffect, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router';
import { useAuthStore, Role } from '../../lib/auth-store';

const portalLoginUrl = (path: string) => {
  if (path.startsWith('/doctor')) return '/doctor/login';
  if (path.startsWith('/pharmacy')) return '/pharmacy/login';
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

/**
 * Check if a dev-role override is active (used for staff/testing bypass).
 * This allows access when no real Supabase session exists but a role was set.
 */
function getDevRoleOverride(): Role | null {
  if (typeof window === 'undefined') return null;
  const devRole = localStorage.getItem('peak_health_dev_role');
  if (devRole) return devRole as Role;
  return null;
}

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { user, role, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const redirected = useRef(false);

  // Effective role: real auth role takes priority, dev override as fallback
  const devRole = getDevRoleOverride();
  const effectiveRole = role || devRole;
  const isAuthenticated = !!user || !!devRole;

  useEffect(() => {
    if (isLoading || redirected.current) return;

    if (!isAuthenticated) {
      redirected.current = true;
      navigate(portalLoginUrl(window.location.pathname), { replace: true });
      return;
    }

    if (allowedRoles && effectiveRole && !allowedRoles.includes(effectiveRole)) {
      redirected.current = true;
      // Arranging Access: Redirect to the user's appropriate portal instead of showing 404
      const targetPortal = 
        effectiveRole === 'doctor' ? '/doctor' : 
        effectiveRole === 'pharmacy' ? '/pharmacy' :
        effectiveRole === 'super_admin' ? '/superadmin' :
        effectiveRole === 'brand_admin' ? '/admin' : 
        '/patient';
      
      console.log(`[ProtectedRoute] Role ${effectiveRole} not allowed on ${window.location.pathname}. Redirecting to ${targetPortal}`);
      navigate(targetPortal, { replace: true });
    }
  }, [isAuthenticated, effectiveRole, isLoading, navigate, allowedRoles]);

  // Show branded loading screen while auth is resolving
  if (isLoading) return <AuthLoadingScreen />;

  // Not logged in and no dev override — show nothing while redirect fires
  if (!isAuthenticated) return <AuthLoadingScreen />;

  // Logged in but wrong role — show nothing while redirect fires
  if (allowedRoles && effectiveRole && !allowedRoles.includes(effectiveRole)) return <AuthLoadingScreen />;

  // ✅ Authenticated + correct role — render the portal
  return <Outlet />;
}
