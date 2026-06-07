/** Canonical login URLs for each staff/partner portal. */
import { referlyPartnerPortalUrl } from "./referly";
import {
  adminPortalBaseFromPath,
  affiliatePortalBaseFromPath,
  isBrandAdminPortalPath,
  isAffiliatePortalPath,
  isPatientPortalPath,
  isSuperAdminPortalPath,
} from "./portalPath";

export const PORTAL_LOGINS = {
  patient: "/login",
  doctor: "/providers/login",
  admin: "/admin/login",
  superadmin: "/superadmin/login",
  /** Bridge on peak-health.io → redirects to Referly white-label portal */
  affiliate: "/affiliate/login",
  pharmacy: "/pharmacy/login",
} as const;

/** Direct Referly partner portal (affiliate sign-in, links, payouts). */
export const REFERLY_AFFILIATE_PORTAL_URL = referlyPartnerPortalUrl();

export const PORTAL_HOME = {
  patient: "/patient",
  doctor: "/providers",
  admin: "/admin",
  superadmin: "/superadmin",
  affiliate: "/affiliate",
  pharmacy: "/pharmacy",
} as const;

export const MARKETING_PORTAL_LINKS = [
  { label: "Patient Portal", href: PORTAL_LOGINS.patient, description: "Orders, intake, messages, prescriptions" },
  { label: "Provider Portal", href: PORTAL_LOGINS.doctor, description: "Clinical queue, consults, eRx, labs" },
  { label: "Admin Portal", href: PORTAL_LOGINS.admin, description: "Brand operations, products, orders" },
  { label: "Affiliate Portal", href: PORTAL_LOGINS.affiliate, description: "Referly partner dashboard — links, conversions, payouts" },
  { label: "Super Admin", href: PORTAL_LOGINS.superadmin, description: "Cross-brand platform control" },
  { label: "Pharmacy Portal", href: PORTAL_LOGINS.pharmacy, description: "Fulfillment, inventory, shipping" },
] as const;

export function portalHomeFromPath(pathname: string): string {
  if (pathname.startsWith("/providers") || pathname.startsWith("/doctor")) {
    return pathname.startsWith("/providers") ? "/providers" : "/doctor";
  }
  if (isBrandAdminPortalPath(pathname)) return adminPortalBaseFromPath(pathname);
  if (isSuperAdminPortalPath(pathname)) return PORTAL_HOME.superadmin;
  if (isAffiliatePortalPath(pathname)) return affiliatePortalBaseFromPath(pathname);
  if (pathname.startsWith("/pharmacy")) return PORTAL_HOME.pharmacy;
  if (isPatientPortalPath(pathname)) return PORTAL_HOME.patient;
  return "/";
}

export function portalHasNotifications(pathname: string): boolean {
  return (
    pathname.startsWith("/patient") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/providers") ||
    isBrandAdminPortalPath(pathname) ||
    isSuperAdminPortalPath(pathname)
  );
}
