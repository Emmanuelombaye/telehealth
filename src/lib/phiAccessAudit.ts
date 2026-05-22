/**
 * PHI access audit — logs who viewed/exported clinical data (HIPAA audit controls).
 * Requires `phi_access_logs` table (see supabase/migrations/20260521120000_phi_access_logs.sql).
 */
import { useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import type { Role } from "./auth-store";

export type PhiAccessType = "staff" | "self" | "system";

export type PhiAccessAction =
  | "view_list"
  | "view_record"
  | "view_messages"
  | "send_message"
  | "export"
  | "print"
  | "update"
  | "download";

export type PhiResourceType =
  | "order"
  | "patient_chart"
  | "message"
  | "prescription"
  | "lab_result"
  | "visit_summary"
  | "document"
  | "vitals"
  | "rpm"
  | "intake"
  | "consult"
  | "pharmacy_order";

export type PhiAccessPayload = {
  action: PhiAccessAction;
  resourceType: PhiResourceType;
  resourceId?: string | null;
  subjectUserId?: string | null;
  accessType?: PhiAccessType;
  detail?: Record<string, unknown>;
};

export type PhiAccessLogRow = {
  id: string;
  created_at: string;
  actor_id: string;
  actor_email: string | null;
  role: string;
  brand_scope: string | null;
  access_type: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  subject_user_id: string | null;
  route_path: string | null;
  detail: Record<string, unknown> | null;
};

function staffRole(role: Role | undefined): boolean {
  return (
    role === "doctor" ||
    role === "pharmacy" ||
    role === "brand_admin" ||
    role === "super_admin"
  );
}

/**
 * Append a PHI access event (best-effort; never blocks UI).
 */
export async function logPhiAccess(payload: PhiAccessPayload): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session?.user) return;

    const meta = session.user.user_metadata || {};
    const appMeta = (session.user as { app_metadata?: Record<string, string> }).app_metadata || {};
    const role = (appMeta.role || meta.role) as Role | undefined;
    const brandScope =
      (appMeta.brand_id as string | undefined) || (meta.brand_id as string | undefined) || null;

    const accessType: PhiAccessType =
      payload.accessType ??
      (role === "patient" ? "self" : staffRole(role) ? "staff" : "system");

    const routePath =
      typeof window !== "undefined" ? window.location.pathname + window.location.search : null;

    const row = {
      actor_id: session.user.id,
      actor_email: session.user.email || (meta.email as string) || null,
      role: role || "unknown",
      brand_scope: brandScope,
      access_type: accessType,
      action: payload.action,
      resource_type: payload.resourceType,
      resource_id: payload.resourceId ?? null,
      subject_user_id: payload.subjectUserId ?? null,
      route_path: routePath,
      detail: payload.detail ?? {},
    };

    const { error } = await supabase.from("phi_access_logs").insert([row]);
    if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
      console.warn("[phiAccessAudit] Table phi_access_logs not installed; skipping log.");
      return;
    }
    if (error) console.warn("[phiAccessAudit] insert failed:", error.message);
  } catch (e) {
    console.warn("[phiAccessAudit]", e);
  }
}

/** Log once per stable key (e.g. route + resource id) per mount/navigation. */
export function usePhiAccessLog(payload: PhiAccessPayload | null, logKey: string): void {
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (!payload || !logKey) return;
    if (seen.current === logKey) return;
    seen.current = logKey;
    void logPhiAccess(payload);
  }, [logKey, payload]);
}
