import type { Role } from "./auth-store";
import { doctorPortalBaseFromPath } from "./doctorPortalBase";

export type StaffPortal = "patient" | "doctor" | "admin" | "superadmin" | "affiliate" | "pharmacy";

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
