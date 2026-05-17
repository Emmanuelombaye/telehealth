import { Shield } from "lucide-react";

export type AdminScopeNoticeVariant = "brand" | "platform";

/** Matches BRAND ADMIN & SUPER ADMIN architecture: non-clinical admin surfaces only. */
export function AdminScopeNotice({ variant }: { variant: AdminScopeNoticeVariant }) {
  // Removed notice rendering as requested by user to declutter workspace
  return null;
}
