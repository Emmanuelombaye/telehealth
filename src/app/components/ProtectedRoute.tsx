import { useEffect, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router';
import { useAuthStore, Role } from '../../lib/auth-store';
import { doctorPortalBaseFromPath } from '../../lib/doctorPortalBase';
import {
  clearForcePatientPortalIntent,
  hasForcePatientPortalIntent,
} from '../../lib/patientPortalIntent';
import { useBrand } from '../context/BrandContext';
import { portalLoginUrl } from '../../lib/portalLoginUrl';
import {
  careSlugFromPath,
  staffPortalTenantAllowed,
  staffPortalTenantDeniedMessage,
} from '../../lib/portalTenantGuard';

export function AuthLoadingScreen() {
  const { brand, isWhiteLabel } = useBrand();
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center gap-6 z-50">
      <img
        src={isWhiteLabel ? brand.logoUrl : "/originallogo.png"}
        alt={brand.logoAlt}
        className="h-14 object-contain opacity-90"
      />
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
        <span className="text-white/50 text-sm font-medium tracking-wide">Verifying credentials...</span>
      </div>
    </div>
  );
}



export function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { user, role, brandId: authBrandId, isLoading } = useAuthStore();
  const { brand: tenantBrand } = useBrand();
  const navigate = useNavigate();
  const redirected = useRef(false);
  const tenantDenied = useRef(false);

  const forcePatient = hasForcePatientPortalIntent();
  const effectiveRole = forcePatient ? 'patient' : role;
  const isAuthenticated = !!user;

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

    // 4. Brand / affiliate tenant scope on /care/:slug/*
    if (
      isAuthenticated &&
      effectiveRole &&
      !staffPortalTenantAllowed(effectiveRole, authBrandId, window.location.pathname, tenantBrand.id)
    ) {
      if (!tenantDenied.current) {
        tenantDenied.current = true;
        console.warn(
          `[ProtectedRoute] Tenant mismatch: role=${effectiveRole} authBrand=${authBrandId} tenant=${tenantBrand.id}`,
        );
        void useAuthStore.getState().signOut().then(() => {
          navigate(portalLoginUrl(window.location.pathname), {
            replace: true,
            state: {
              error: staffPortalTenantDeniedMessage(careSlugFromPath(window.location.pathname)),
            },
          });
        });
      }
      return;
    }

    // 5. Handle Role-based Access Control (RBAC)
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
      const careMatch =
        typeof window !== 'undefined' ? window.location.pathname.match(/^\/care\/([^/]+)/) : null;
      const targetPortal =
        effectiveRole === 'doctor'
          ? doctorBase
          : effectiveRole === 'pharmacy'
            ? '/pharmacy'
            : effectiveRole === 'super_admin'
              ? '/superadmin'
              : effectiveRole === 'brand_admin'
                ? careMatch
                  ? `/care/${careMatch[1]}/admin`
                  : '/admin'
                : effectiveRole === 'affiliate'
                  ? careMatch
                    ? `/care/${careMatch[1]}/affiliate`
                    : '/affiliate'
                  : careMatch
                    ? `/care/${careMatch[1]}/patient`
                    : '/patient';
      
      console.log(`[ProtectedRoute] RBAC mismatch: User role "${effectiveRole}" not in [${rolesKey}]. Redirecting to ${targetPortal}`);
      navigate(targetPortal, { replace: true });
    }
  }, [isAuthenticated, effectiveRole, isLoading, navigate, rolesKey, authBrandId, tenantBrand.id]);

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
  const p = window.location.pathname;
  if (forcePatient && (p.startsWith('/patient') || /^\/care\/[^/]+\/patient/.test(p))) {
    clearForcePatientPortalIntent();
  }
  return <Outlet />;
}
