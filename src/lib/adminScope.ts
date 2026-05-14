import type { Role } from "./auth-store";

type OrdersQuery = {
  eq: (column: string, value: string) => OrdersQuery;
};

/**
 * Orders columns safe for brand / platform admin UIs (no intake payloads, vitals, or prescriber free-text).
 * Keep in sync with migrations under `supabase_*.sql`; omit columns your DB does not have if PostgREST errors.
 */
export const ORDERS_ADMIN_NON_CLINICAL_SELECT = [
  "id",
  "order_number",
  "user_id",
  "patient_name",
  "patient_avatar",
  "patient_age",
  "patient_country",
  "patient_email",
  "sub_brand",
  "medication",
  "dosage_instructions",
  "category",
  "status",
  "ordered_date",
  "consultation_submitted_date",
  "pharmacy",
  "amount",
  "doctor",
  "doctor_id",
  "tracking",
  "tracking_number",
  "carrier",
  "tracking_url",
  "estimated_delivery",
  "shipped_date",
  "urgent",
  "intake_complete",
  "wait_mins",
  "time",
  "mrn",
  "timeline",
  "created_at",
  "zoom_status",
  "zoom_rescheduled_time",
  "zoom_join_url",
  "consultation_time",
  "consultation_live",
  "payment_status",
  "kyc_status",
  "referral_code",
  "pharmacy_note",
  "pharmacy_email",
  "last_approved_at",
  "next_refill_at",
  "refill_interval_days",
  "stripe_payment_intent_id",
  "stripe_customer_id",
].join(",");

export type OrdersFetchMode = "clinical" | "admin";

/** Admin portals must not hydrate clinical columns into the global order store. Doctor/patient portals stay clinical. */
export function resolveOrdersFetchMode(role: Role | null): OrdersFetchMode {
  if (role === "brand_admin") return "admin";
  if (role === "doctor") return "clinical";
  if (role === "patient") return "clinical";
  if (role === "super_admin") {
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      if (p.startsWith("/admin") || p.startsWith("/superadmin")) return "admin";
    }
    return "clinical";
  }
  return "clinical";
}

export function ordersSelectForMode(mode: OrdersFetchMode): string {
  return mode === "admin" ? ORDERS_ADMIN_NON_CLINICAL_SELECT : "*";
}

/** Brand admins are strictly scoped to their JWT `brand_id` / `sub_brand` string. */
export function applyOrdersBrandScope(
  q: OrdersQuery,
  role: Role | null,
  brandId: string | null
): OrdersQuery {
  if (role === "brand_admin" && brandId) {
    return q.eq("sub_brand", brandId);
  }
  return q;
}
