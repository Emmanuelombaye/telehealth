/** Detect portal type from URL — supports Peak paths and white-label `/care/:slug/...` routes. */

const CARE_ADMIN_RE = /^\/care\/[^/]+\/admin(?:\/|$)/;
const CARE_AFFILIATE_RE = /^\/care\/[^/]+\/affiliate(?:\/|$)/;
const CARE_PATIENT_RE = /^\/care\/[^/]+\/patient(?:\/|$)/;

export type SidebarRole = "patient" | "doctor" | "admin" | "superadmin" | "affiliate";

export function isBrandAdminPortalPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || CARE_ADMIN_RE.test(pathname);
}

export function isSuperAdminPortalPath(pathname: string): boolean {
  return pathname.startsWith("/superadmin");
}

export function isStaffAdminPortalPath(pathname: string): boolean {
  return isBrandAdminPortalPath(pathname) || isSuperAdminPortalPath(pathname);
}

export function isAffiliatePortalPath(pathname: string): boolean {
  return pathname.startsWith("/affiliate") || CARE_AFFILIATE_RE.test(pathname);
}

export function isPatientPortalPath(pathname: string): boolean {
  return pathname.startsWith("/patient") || CARE_PATIENT_RE.test(pathname);
}

/** Canonical admin base: `/admin`, `/superadmin`, or `/care/:slug/admin`. */
export function adminPortalBaseFromPath(pathname: string, fallback = "/admin"): string {
  const care = pathname.match(/^\/care\/([^/]+)\/admin/);
  if (care) return `/care/${care[1]}/admin`;
  if (pathname.startsWith("/superadmin")) return "/superadmin";
  if (pathname.startsWith("/admin")) return "/admin";
  return fallback;
}

export function affiliatePortalBaseFromPath(pathname: string, fallback = "/affiliate"): string {
  const care = pathname.match(/^\/care\/([^/]+)\/affiliate/);
  if (care) return `/care/${care[1]}/affiliate`;
  if (pathname.startsWith("/affiliate")) return "/affiliate";
  return fallback;
}

export function sidebarRoleFromPath(pathname: string): SidebarRole {
  if (pathname.startsWith("/doctor") || pathname.startsWith("/providers")) return "doctor";
  if (isSuperAdminPortalPath(pathname)) return "superadmin";
  if (isBrandAdminPortalPath(pathname)) return "admin";
  if (isAffiliatePortalPath(pathname)) return "affiliate";
  return "patient";
}

/** Rewrite a Peak-native portal href to the current tenant base when on white-label routes. */
export function rewritePortalHref(
  href: string,
  role: SidebarRole,
  pathname: string,
): string {
  if (role === "admin") {
    const base = adminPortalBaseFromPath(pathname);
    if (href === "/admin") return base;
    if (href.startsWith("/admin/")) return `${base}${href.slice("/admin".length)}`;
  }
  if (role === "affiliate") {
    const base = affiliatePortalBaseFromPath(pathname);
    if (href === "/affiliate") return base;
    if (href.startsWith("/affiliate/")) return `${base}${href.slice("/affiliate".length)}`;
  }
  return href;
}
