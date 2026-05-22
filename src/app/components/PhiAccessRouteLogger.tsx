import { useLocation } from "react-router";
import { useAuthStore } from "../../lib/auth-store";
import { logPhiAccess } from "../../lib/phiAccessAudit";
import { resolvePhiAccessFromLocation } from "../../lib/phiAccessRouteMap";
import { useEffect, useRef } from "react";

/**
 * Logs PHI screen access once per navigation (doctor/patient/admin/pharmacy clinical routes).
 */
export function PhiAccessRouteLogger() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const key = `${location.pathname}${location.search}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    const payload = resolvePhiAccessFromLocation(location.pathname, location.search, {
      actorUserId: user.id,
      actorRole: role,
    });
    if (!payload) return;
    void logPhiAccess(payload);
  }, [location.pathname, location.search, user, role]);

  return null;
}
