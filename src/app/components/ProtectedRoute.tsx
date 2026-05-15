import { useEffect, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router';
import { useAuthStore, Role } from '../../lib/auth-store';
import { doctorPortalBaseFromPath } from '../../lib/doctorPortalBase';
import {
  clearForcePatientPortalIntent,
  hasForcePatientPortalIntent,
} from '../../lib/enrollmentPatientAuth';

const portalLoginUrl = (path: string) => {
  if (path.startsWith('/doctor')) return '/doctor/login';
  if (path.startsWith('/providers')) return '/providers/login';
  if (path.startsWith('/pharmacy')) return '/pharmacy/login';
  if (path.startsWith('/admin')) return '/admin/login';
  if (path.startsWith('/superadmin')) return '/superadmin/login';
  if (path.startsWith('/affiliate')) return '/affiliate/login';
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

  // Dev override only when there is no real Supabase user (staff testing bypass).
  const devRole = getDevRoleOverride();
  const forcePatient = hasForcePatientPortalIntent();
  const effectiveRole = forcePatient ? 'patient' : user ? role : devRole;
  const isAuthenticated = !!user || !!devRole;

  // Memoize allowed roles check to prevent infinite loops from unstable array props
  const rolesKey = allowedRoles?.join(',') || '';

  useEffect(() => {
    // 1. Wait for auth to resolve
    if (isLoading) return;

    // 2. Prevent repeated redirects in the same component lifecycle
    if (redirected.current) return;

    // 3. Handle Unauthenticated users
    if (!isAuthenticated) {
      console.log(`[ProtectedRoute] Not authenticated on ${window.location.pathname}. Redirecting to login.`);
      redirected.current = true;
      navigate(portalLoginUrl(window.location.pathname), { replace: true });
      return;
    }

    // 4. Handle Role-based Access Control (RBAC)
    if (
      allowedRoles &&
      effectiveRole &&
      !allowedRoles.includes(effectiveRole) &&
      !forcePatient
    ) {
      redirected.current = true;
      
      const doctorBase =
        typeof window !== 'undefined'
          ? doctorPortalBaseFromPath(window.location.pathname)
          : '/doctor';
      const targetPortal =
        effectiveRole === 'doctor'
          ? doctorBase
          : effectiveRole === 'pharmacy'
            ? '/pharmacy'
            : effectiveRole === 'super_admin'
              ? '/superadmin'
              : effectiveRole === 'brand_admin'
                ? '/admin'
                : effectiveRole === 'affiliate'
                  ? '/affiliate'
                  : '/patient';
      
      console.log(`[ProtectedRoute] RBAC mismatch: User role "${effectiveRole}" not in [${rolesKey}]. Redirecting to ${targetPortal}`);
      navigate(targetPortal, { replace: true });
    }
  }, [isAuthenticated, effectiveRole, isLoading, navigate, rolesKey]);

  // Show branded loading screen while auth is resolving
  if (isLoading) return <AuthLoadingScreen />;

  // Not logged in and no dev override — show nothing while redirect fires
  if (!isAuthenticated) return <AuthLoadingScreen />;

  // Logged in but wrong role — show nothing while redirect fires
  if (
    allowedRoles &&
    effectiveRole &&
    !allowedRoles.includes(effectiveRole) &&
    !forcePatient
  ) {
    return <AuthLoadingScreen />;
  }

  // ✅ Authenticated + correct role — render the portal
  if (forcePatient && window.location.pathname.startsWith('/patient')) {
    clearForcePatientPortalIntent();
  }
  return <Outlet />;
}
