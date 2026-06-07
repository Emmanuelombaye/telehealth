import { DEFAULT_BRAND_ID } from "../app/components/os/constants";
import type { Role } from "./auth-store";

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
      if (
        p.startsWith("/admin") ||
        p.startsWith("/superadmin") ||
        /^\/care\/[^/]+\/admin(?:\/|$)/.test(p)
      ) {
        return "admin";
      }
    }
    return "clinical";
  }
  return "clinical";
}

export function ordersSelectForMode(mode: OrdersFetchMode): string {
  return mode === "admin" ? ORDERS_ADMIN_NON_CLINICAL_SELECT : "*";
}

/** Brand-scopes an orders query builder; preserves concrete Supabase/PostgREST chain types. */
/** Legacy Peak Health orders used display name before multi-brand UUID keys. */
const LEGACY_PEAK_SUB_BRAND = "Peak Health";

/** Legacy JWT / provision values before brand UUID normalization. */
const LEGACY_PEAK_BRAND_KEYS = new Set(["peak", "peak-health", DEFAULT_BRAND_ID]);

function normalizeAdminBrandId(brandId: string | null): string | null {
  if (!brandId) return null;
  if (brandId === "peak" || brandId === "peak-health") return DEFAULT_BRAND_ID;
  return brandId;
}

export function applyOrdersBrandScope<Q extends {
  eq: (column: string, value: string) => Q;
  or?: (filter: string) => Q;
}>(
  q: Q,
  role: Role | null,
  brandId: string | null
): Q {
  if (role === "brand_admin" && brandId) {
    const scopedBrand = normalizeAdminBrandId(brandId);
    if (scopedBrand && typeof q.or === "function" && LEGACY_PEAK_BRAND_KEYS.has(scopedBrand)) {
      return q.or(`sub_brand.eq.${scopedBrand},sub_brand.eq.${LEGACY_PEAK_SUB_BRAND}`);
    }
    if (scopedBrand) return q.eq("sub_brand", scopedBrand);
  }
  return q;
}
