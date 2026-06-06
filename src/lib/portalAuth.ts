import type { Role } from "./auth-store";
import { doctorPortalBaseFromPath } from "./doctorPortalBase";
import { PORTAL_LOGINS } from "./portalLinks";

export type StaffPortal = "patient" | "doctor" | "admin" | "superadmin" | "affiliate" | "pharmacy";

const ROLE_PORTAL_LABEL: Record<NonNullable<Role>, string> = {
  super_admin: "Super Admin",
  doctor: "Provider",
  brand_admin: "Admin",
  affiliate: "Affiliate",
  pharmacy: "Pharmacy",
  patient: "Patient",
};

/** Login URL + label when a user signed in on the wrong portal. */
export function suggestedPortalLoginForRole(
  role: Role,
): { path: string; label: string } | null {
  if (!role) return null;
  switch (role) {
    case "super_admin":
      return { path: PORTAL_LOGINS.superadmin, label: ROLE_PORTAL_LABEL.super_admin };
    case "doctor":
      return { path: PORTAL_LOGINS.doctor, label: ROLE_PORTAL_LABEL.doctor };
    case "brand_admin":
      return { path: PORTAL_LOGINS.admin, label: ROLE_PORTAL_LABEL.brand_admin };
    case "affiliate":
      return { path: PORTAL_LOGINS.affiliate, label: ROLE_PORTAL_LABEL.affiliate };
    case "pharmacy":
      return { path: PORTAL_LOGINS.pharmacy, label: ROLE_PORTAL_LABEL.pharmacy };
    case "patient":
      return { path: PORTAL_LOGINS.patient, label: ROLE_PORTAL_LABEL.patient };
    default:
      return null;
  }
}

export function portalAccessDeniedMessage(
  role: Role,
  portal: StaffPortal,
): { message: string; redirect: { path: string; label: string } | null } {
  const redirect = role ? suggestedPortalLoginForRole(role) : null;
  const roleLabel = role ? ROLE_PORTAL_LABEL[role] : null;

  switch (portal) {
    case "superadmin":
      return {
        message: roleLabel
          ? `This is a ${roleLabel} account. Super Admin access requires a super admin account.`
          : "Access denied. Super Admin portal only.",
        redirect,
      };
    case "doctor":
      return {
        message: roleLabel
          ? `This is a ${roleLabel} account. The Provider portal requires a doctor account.`
          : "Access denied. Provider portal requires a doctor account.",
        redirect,
      };
    case "admin":
      return {
        message: roleLabel
          ? `This is a ${roleLabel} account. The Admin portal requires a brand admin account.`
          : "Access denied. Admin portal only.",
        redirect,
      };
    case "affiliate":
      return {
        message: roleLabel
          ? `This is a ${roleLabel} account. The Affiliate portal requires an affiliate account.`
          : "Access denied. Affiliate portal only.",
        redirect,
      };
    case "pharmacy":
      return {
        message: roleLabel
          ? `This is a ${roleLabel} account. The Pharmacy portal requires a pharmacy, doctor, or admin account.`
          : "Access denied. Pharmacy portal only.",
        redirect,
      };
    default:
      return { message: "Access denied.", redirect };
  }
}

/** Whether this role may use the portal behind a login screen (matches ProtectedRoute rules). */
export function roleCanAccessPortal(role: Role, portal: StaffPortal): boolean {
  if (!role) return false;
  if (role === "super_admin") return portal !== "patient";
  switch (portal) {
    case "patient":
      return role === "patient";
    case "doctor":
      return role === "doctor";
    case "admin":
      return role === "brand_admin";
    case "superadmin":
      return false;
    case "affiliate":
      return role === "affiliate";
    case "pharmacy":
      return role === "pharmacy" || role === "doctor" || role === "brand_admin";
    default:
      return false;
  }
}

export function portalHomePath(portal: StaffPortal, pathname: string, patientPortalBase: string): string {
  const careMatch = pathname.match(/^\/care\/([^/]+)/);
  const carePrefix = careMatch ? `/care/${careMatch[1]}` : null;

  switch (portal) {
    case "doctor":
      return doctorPortalBaseFromPath(pathname);
    case "admin":
      return carePrefix ? `${carePrefix}/admin` : "/admin";
    case "superadmin":
      return "/superadmin";
    case "affiliate":
      return carePrefix ? `${carePrefix}/affiliate` : "/affiliate";
    case "pharmacy":
      return "/pharmacy";
    case "patient":
    default:
      return patientPortalBase.replace(/\/$/, "") || "/patient";
  }
}
