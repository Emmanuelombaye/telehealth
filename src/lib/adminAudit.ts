import { supabase } from "./supabaseClient";
import type { Role } from "./auth-store";

export type AdminAuditPayload = {
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
};

/**
 * Best-effort audit row for admin / superadmin actions. Requires `admin_audit_logs` table (see supabase_admin_audit_and_scope.sql).
 */
export async function logAdminAudit(payload: AdminAuditPayload): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session?.user) return;

    const meta = session.user.user_metadata || {};
    const appMeta = (session.user as { app_metadata?: Record<string, string> }).app_metadata || {};
    const role = (appMeta.role || meta.role) as Role | undefined;
    const brandScope =
      (appMeta.brand_id as string | undefined) || (meta.brand_id as string | undefined) || null;

    const row = {
      actor_id: session.user.id,
      actor_email: session.user.email || meta.email || null,
      role: role || "unknown",
      brand_scope: brandScope,
      action: payload.action,
      target_type: payload.targetType ?? null,
      target_id: payload.targetId ?? null,
      detail: payload.detail ?? {},
    };

    const { error } = await supabase.from("admin_audit_logs").insert([row]);
    if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
      console.warn("[adminAudit] Table admin_audit_logs not installed; skipping log.");
      return;
    }
    if (error) console.warn("[adminAudit] insert failed:", error.message);
  } catch (e) {
    console.warn("[adminAudit]", e);
  }
}
