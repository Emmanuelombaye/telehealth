import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../../lib/auth-store";
import { portalLoginUrl } from "../../lib/portalLoginUrl";

const STAFF_IDLE_MS = 30 * 60 * 1000;

const STAFF_ROLES = new Set(["doctor", "pharmacy", "brand_admin", "super_admin", "affiliate"]);

/**
 * Auto sign-out staff after idle period (HIPAA session control).
 */
export function StaffSessionGuard() {
  const { user, role, signOut } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || !role || !STAFF_ROLES.has(role)) return;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void (async () => {
          const login = portalLoginUrl(location.pathname);
          await signOut();
          navigate(login, { replace: true, state: { reason: "idle_timeout" } });
        })();
      }, STAFF_IDLE_MS);
    };

    reset();
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;
    for (const ev of events) window.addEventListener(ev, reset, { passive: true });
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const ev of events) window.removeEventListener(ev, reset);
    };
  }, [user, role, signOut, navigate, location.pathname]);

  return null;
}
