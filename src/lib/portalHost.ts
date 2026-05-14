/**
 * Maps first DNS label → app path for staff/partner portals on subdomains
 * (e.g. admin.peak-health.io → /admin). Only applied when the hostname looks
 * like our production/staging apex (see {@link shouldApplySubdomainPortalMap}).
 */
export const SUBDOMAIN_PORTAL_PATH: Record<string, string> = {
  admin: "/admin",
  superadmin: "/superadmin",
  /** Public name "doctors" host → `/providers` path. */
  doctors: "/providers",
  /** Legacy/alternate subdomain. */
  doctor: "/doctor",
  patient: "/patient",
  affiliate: "/affiliate",
};

export function shouldApplySubdomainPortalMap(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.startsWith("127.0.0.1")) return true;
  return h.endsWith(".peak-health.io");
}

/** If the user landed on a portal subdomain at `/`, rewrite the path before the router mounts. */
export function applySubdomainPortalPathRewrite(): void {
  if (typeof window === "undefined") return;
  const { hostname, pathname } = window.location;
  if (!shouldApplySubdomainPortalMap(hostname)) return;

  const sub = hostname.split(".")[0]?.toLowerCase() ?? "";
  const target = SUBDOMAIN_PORTAL_PATH[sub];
  if (!target) return;

  if (pathname === "/" || pathname === "") {
    window.history.replaceState(null, "", target);
  }
}

/** Normalize legacy marketing-style path `/Affiliate` → `/affiliate`. */
export function applyAffiliatePathCaseNormalize(): void {
  if (typeof window === "undefined") return;
  const { pathname } = window.location;
  if (pathname === "/Affiliate" || pathname.startsWith("/Affiliate/")) {
    window.history.replaceState(
      null,
      "",
      "/affiliate" + pathname.slice("/Affiliate".length),
    );
  }
}
