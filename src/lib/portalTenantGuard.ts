import type { Role } from "./auth-store";
import { normalizeAdminBrandId } from "./adminScope";

export function careSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/care\/([^/]+)/);
  return m?.[1] ?? null;
}

export function brandIdsMatch(
  authBrandId: string | null | undefined,
  tenantBrandId: string | null | undefined,
): boolean {
  const a = normalizeAdminBrandId(authBrandId ?? null);
  const t = normalizeAdminBrandId(tenantBrandId ?? null);
  if (!a || !t) return false;
  return a === t;
}

/**
 * Brand admins may only access admin/affiliate portals for their own tenant on /care/:slug/*.
 * Super admins bypass. Peak /admin uses JWT brand only (no slug in path).
 */
export function staffPortalTenantAllowed(
  role: Role,
  authBrandId: string | null,
  pathname: string,
  tenantBrandId?: string | null,
): boolean {
  if (role === "super_admin") return true;
  if (role !== "brand_admin" && role !== "affiliate") return true;

  const careSlug = careSlugFromPath(pathname);
  if (!careSlug) return true;

  if (!tenantBrandId) return false;
  return brandIdsMatch(authBrandId, tenantBrandId);
}

export function staffPortalTenantDeniedMessage(careSlug: string | null): string {
  if (careSlug) {
    return `This account is not authorized for the ${careSlug.replace(/-/g, " ")} portal. Sign in with the correct brand admin credentials.`;
  }
  return "This account is not authorized for this portal.";
}
