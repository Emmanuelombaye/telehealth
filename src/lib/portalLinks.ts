/** Canonical login URLs for each staff/partner portal. */
export const PORTAL_LOGINS = {
  patient: "/login",
  doctor: "/providers/login",
  admin: "/admin/login",
  superadmin: "/superadmin/login",
  affiliate: "/affiliate/login",
} as const;

export type PortalKey = keyof typeof PORTAL_LOGINS;

/** Protected app roots (post-login). */
export const PORTAL_HOME = {
  patient: "/patient",
  doctor: "/providers",
  admin: "/admin",
  superadmin: "/superadmin",
  affiliate: "/affiliate",
} as const;

/** Shown in marketing footer / support — links to the right login, not patient `/login`. */
export const MARKETING_PORTAL_LINKS: { label: string; href: string; description?: string }[] = [
  { label: "Patient Portal", href: PORTAL_LOGINS.patient, description: "Orders, intake, messages, prescriptions" },
  { label: "Provider Portal", href: PORTAL_LOGINS.doctor, description: "Clinical queue, consults, eRx, labs" },
  { label: "Admin Portal", href: PORTAL_LOGINS.admin, description: "Brand operations, products, orders" },
  { label: "Affiliate Portal", href: PORTAL_LOGINS.affiliate, description: "Referrals, payouts, marketing assets" },
  { label: "Super Admin", href: PORTAL_LOGINS.superadmin, description: "Cross-brand platform control" },
];

/** App home link for header logo — respects /providers vs /doctor. */
export function portalHomeFromPath(pathname: string): string {
  if (pathname.startsWith("/providers") || pathname.startsWith("/doctor")) {
    return pathname.startsWith("/providers") ? "/providers" : "/doctor";
  }
  if (pathname.startsWith("/admin")) return PORTAL_HOME.admin;
  if (pathname.startsWith("/superadmin")) return PORTAL_HOME.superadmin;
  if (pathname.startsWith("/affiliate")) return PORTAL_HOME.affiliate;
  if (pathname.startsWith("/pharmacy")) return "/pharmacy";
  if (pathname.startsWith("/patient")) return PORTAL_HOME.patient;
  return "/";
}

/** Roles that have a notifications route in the router. */
export function portalHasNotifications(pathname: string): boolean {
  return (
    pathname.startsWith("/patient") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/providers") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/superadmin")
  );
}

export const PHARMACY_LOGIN = "/pharmacy/login";
