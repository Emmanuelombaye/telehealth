/**
 * Doctor patient registry — dedupe encounters from `orders` into one chart per patient.
 */

import { buildDoctorIntakeReview, orderToIntakeSource } from "./doctorIntakeReview";
import { filterClinicalPatientOrders } from "./clinicalTestData";
import { parseIntakeVitals, type IntakeVitals } from "./vitalsClinical";
import {
  resolvePatientDisplayName,
  type ProfileMini,
} from "./profileLookup";

export type PatientRisk = "low" | "medium" | "high";

export type PatientCareStatus = "needs_review" | "active" | "completed" | "idle";

export type DoctorPatientRecord = {
  /** Stable key: user_id or normalized name */
  registryKey: string;
  userId: string | null;
  /** Latest order id — used for `/patients/:id` route */
  primaryOrderId: string;
  name: string;
  subBrand: string | null;
  age: number | null;
  email: string | null;
  phone: string | null;
  category: string;
  medication: string;
  latestStatus: string;
  careStatus: PatientCareStatus;
  risk: PatientRisk;
  encounterCount: number;
  lastEncounterAt: string;
  intakeComplete: boolean;
  enrollmentVideoRequired: boolean;
  intake: IntakeVitals | null;
  orders: RawOrderRow[];
};

export type RawOrderRow = {
  id: string;
  user_id?: string | null;
  order_number?: string;
  patient_name?: string | null;
  patient_age?: number | null;
  patient_email?: string | null;
  patient_phone?: string | null;
  category?: string | null;
  medication?: string | null;
  sub_brand?: string | null;
  status?: string | null;
  urgent?: boolean | null;
  intake_complete?: boolean | null;
  enrollment_video_required?: boolean | null;
  patient_vitals?: unknown;
  intake_answers?: Record<string, unknown> | null;
  created_at?: string | null;
  shipping_address_line1?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
};

const REVIEW_STATUSES = new Set(["medical_review", "order_submitted", "intake_completed"]);

const ACTIVE_STATUSES = new Set([
  "medical_review",
  "order_submitted",
  "intake_completed",
  "account_created",
  "id_verified",
  "rx_sent",
  "shipped",
  "follow_up",
  "refill_eligible",
]);

export function deriveCareStatus(orders: RawOrderRow[]): PatientCareStatus {
  if (orders.some((o) => REVIEW_STATUSES.has(o.status || ""))) return "needs_review";
  if (orders.some((o) => ACTIVE_STATUSES.has(o.status || ""))) return "active";
  if (orders.every((o) => o.status === "delivered")) return "completed";
  return "idle";
}

export function deriveRisk(latest: RawOrderRow, orders: RawOrderRow[]): PatientRisk {
  if (latest.urgent) return "high";
  try {
    const review = buildDoctorIntakeReview(orderToIntakeSource({
      id: latest.id,
      patientName: latest.patient_name ?? undefined,
      category: latest.category ?? undefined,
      medication: latest.medication ?? undefined,
      intakeComplete: latest.intake_complete ?? undefined,
      intakeAnswers: latest.intake_answers ?? undefined,
      enrollmentVideoRequired: latest.enrollment_video_required ?? undefined,
      urgent: latest.urgent ?? undefined,
    }));
    if (review.overallRisk === "critical" || review.overallRisk === "elevated") return "high";
  } catch {
    /* intake review optional */
  }
  if (orders.some((o) => o.enrollment_video_required)) return "medium";
  return "low";
}

export function buildPatientRegistry(
  rows: RawOrderRow[],
  nameContext?: { profiles?: Map<string, ProfileMini>; orderNames?: Map<string, string> },
): DoctorPatientRecord[] {
  const groups = new Map<string, RawOrderRow[]>();

  for (const row of rows) {
    const key = row.user_id || (row.patient_name || row.id).trim().toLowerCase();
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const registry: DoctorPatientRecord[] = [];

  for (const [registryKey, orders] of groups) {
    const sorted = [...orders].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
    );
    const latest = sorted[0];
    if (!latest) continue;

    registry.push({
      registryKey,
      userId: latest.user_id ?? null,
      primaryOrderId: latest.id,
      name: resolvePatientDisplayName({
        userId: latest.user_id,
        orderPatientName: latest.patient_name,
        profiles: nameContext?.profiles,
        orderNames: nameContext?.orderNames,
      }),
      subBrand: latest.sub_brand?.trim() || null,
      age: latest.patient_age ?? null,
      email: latest.patient_email ?? null,
      phone: latest.patient_phone ?? null,
      category: latest.category || "General",
      medication: latest.medication || "Consultation",
      latestStatus: latest.status || "unknown",
      careStatus: deriveCareStatus(sorted),
      risk: deriveRisk(latest, sorted),
      encounterCount: sorted.length,
      lastEncounterAt: latest.created_at || new Date().toISOString(),
      intakeComplete: latest.intake_complete === true,
      enrollmentVideoRequired: latest.enrollment_video_required === true,
      intake: parseIntakeVitals(latest.patient_vitals),
      orders: sorted,
    });
  }

  return registry.sort(
    (a, b) => new Date(b.lastEncounterAt).getTime() - new Date(a.lastEncounterAt).getTime(),
  );
}

export const CARE_STATUS_STYLES: Record<
  PatientCareStatus,
  { label: string; badge: string }
> = {
  needs_review: { label: "Needs review", badge: "bg-amber-100 text-amber-900 border-amber-200" },
  active: { label: "Active care", badge: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  completed: { label: "Completed", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  idle: { label: "Idle", badge: "bg-slate-50 text-slate-500 border-slate-100" },
};

export const RISK_STYLES: Record<PatientRisk, { label: string; badge: string; dot: string }> = {
  low: { label: "Low risk", badge: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  medium: { label: "Moderate", badge: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  high: { label: "High risk", badge: "bg-red-50 text-red-800 border-red-200", dot: "bg-red-500 animate-pulse" },
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  order_submitted: "Submitted",
  account_created: "Account created",
  id_verified: "ID verified",
  intake_completed: "Intake complete",
  medical_review: "Physician review",
  rx_sent: "Rx sent",
  shipped: "Shipped",
  delivered: "Delivered",
  follow_up: "Follow-up",
  refill_eligible: "Refill eligible",
};

export function formatPatientDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
