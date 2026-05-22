/**
 * Prescription dispatch, ledger rows, patient refill requests, and PDF export.
 */

import { openBrandedPrintDocument } from "./brandedExport";
import { logPhiAccess } from "./phiAccessAudit";
import { supabase } from "./supabaseClient";
import { useAuthStore } from "./auth-store";

export type PrescriptionStatus = "active" | "fulfilled" | "expired" | "discontinued";

export type PrescriptionRecord = {
  id: string;
  patient_id: string;
  doctor_id?: string | null;
  medication: string;
  dosage: string;
  frequency?: string | null;
  refills_remaining?: number | null;
  pharmacy_name?: string | null;
  status: PrescriptionStatus | string;
  expires_at?: string | null;
  created_at?: string;
  doctor_name?: string | null;
};

export type DispatchPrescriptionInput = {
  /** Supabase orders.id (UUID) or order_number */
  orderKey: string;
  dosageInstructions: string;
  doctorNote: string;
  pharmacy?: string;
  medication?: string;
  refillsRemaining?: number;
};

export type DispatchPrescriptionResult = {
  ok: boolean;
  pharmacyConfirmationId?: string | null;
  error?: string;
  usedFallback?: boolean;
};

export function doctorDisplayName(meta?: Record<string, unknown>): string {
  const first = (meta?.first_name as string) || "";
  const last = (meta?.last_name as string) || "";
  if (first) return `Dr. ${first} ${last}`.trim();
  return "Attending Physician";
}

/** Resolve UUID from order_number or pass through if already UUID-like. */
export async function resolveOrderDbId(orderKey: string): Promise<string | null> {
  if (!orderKey) return null;
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidLike.test(orderKey)) return orderKey;

  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("order_number", orderKey)
    .maybeSingle();

  if (error) {
    console.warn("[prescriptions] resolveOrderDbId:", error.message);
    return null;
  }
  return data?.id ?? null;
}

/** Invoke dispatch-prescription edge function; fallback to direct order update if unavailable. */
export async function dispatchPrescription(
  input: DispatchPrescriptionInput,
): Promise<DispatchPrescriptionResult> {
  const orderDbId = await resolveOrderDbId(input.orderKey);
  if (!orderDbId) {
    return { ok: false, error: "Order not found" };
  }

  const pharmacy = input.pharmacy || "truepill";
  const body = {
    order_id: orderDbId,
    dosage_instructions: input.dosageInstructions,
    doctor_note: input.doctorNote,
    pharmacy,
  };

  try {
    const { data, error } = await supabase.functions.invoke("dispatch-prescription", { body });
    if (!error && data?.success) {
      return {
        ok: true,
        pharmacyConfirmationId: data.pharmacy_confirmation_id ?? null,
      };
    }

    const msg = error?.message || data?.error || "Edge function failed";
    console.warn("[prescriptions] dispatch-prescription:", msg, "— using fallback");
  } catch (e) {
    console.warn("[prescriptions] invoke failed:", e);
  }

  return dispatchPrescriptionFallback(orderDbId, input);
}

async function dispatchPrescriptionFallback(
  orderDbId: string,
  input: DispatchPrescriptionInput,
): Promise<DispatchPrescriptionResult> {
  const pharmacy = input.pharmacy || "truepill";
  const confirmationId = `LOCAL-${Date.now()}`;

  const patch: Record<string, unknown> = {
    status: "rx_sent",
    dosage_instructions: input.dosageInstructions,
    doctor_note: input.doctorNote,
    pharmacy_name: pharmacy,
    rx_dispatched: true,
    pharmacy_dispatched_at: new Date().toISOString(),
    pharmacy_confirmation_id: confirmationId,
  };
  if (input.medication) patch.medication = input.medication;

  const { error } = await supabase.from("orders").update(patch).eq("id", orderDbId);
  if (error) return { ok: false, error: error.message, usedFallback: true };

  return { ok: true, pharmacyConfirmationId: confirmationId, usedFallback: true };
}

export async function attributeOrderToDoctor(
  orderKey: string,
  doctorId: string | undefined,
  doctorName: string,
): Promise<void> {
  const orderDbId = await resolveOrderDbId(orderKey);
  if (!orderDbId) return;

  const { error } = await supabase
    .from("orders")
    .update({
      doctor: doctorName,
      doctor_id: doctorId ?? null,
      last_approved_at: new Date().toISOString(),
    })
    .eq("id", orderDbId);

  if (error) console.warn("[prescriptions] doctor attribution:", error.message);
}

export async function insertPrescriptionRecord(params: {
  patientId: string;
  doctorId?: string | null;
  medication: string;
  dosage: string;
  sig?: string;
  pharmacyName?: string;
  refillsRemaining?: number;
  status?: PrescriptionStatus;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("prescriptions").insert([
    {
      patient_id: params.patientId,
      doctor_id: params.doctorId ?? null,
      medication: params.medication,
      dosage: params.dosage,
      frequency: params.sig || "As directed",
      status: params.status || "active",
      refills_remaining: params.refillsRemaining ?? 5,
      pharmacy_name: params.pharmacyName || "VIALSRX EXPRESS",
    },
  ]);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Full approve-and-dispatch used by Queue and Consult. */
export async function approveAndDispatchPrescription(params: {
  orderKey: string;
  patientId: string | null | undefined;
  medication: string;
  dosageInstructions: string;
  doctorNote: string;
  pharmacy: string;
  refillsRemaining?: number;
}): Promise<DispatchPrescriptionResult & { prescriptionInserted?: boolean }> {
  const user = useAuthStore.getState().user;
  const doctorName = doctorDisplayName(user?.user_metadata as Record<string, unknown>);

  const dispatch = await dispatchPrescription({
    orderKey: params.orderKey,
    dosageInstructions: params.dosageInstructions,
    doctorNote: params.doctorNote,
    pharmacy: params.pharmacy,
    medication: params.medication,
  });

  if (!dispatch.ok) return dispatch;

  await attributeOrderToDoctor(params.orderKey, user?.id, doctorName);

  let prescriptionInserted = false;
  if (params.patientId) {
    const ins = await insertPrescriptionRecord({
      patientId: params.patientId,
      doctorId: user?.id,
      medication: params.medication,
      dosage: params.dosageInstructions,
      sig: params.doctorNote,
      pharmacyName: params.pharmacy,
      refillsRemaining: params.refillsRemaining,
    });
    prescriptionInserted = ins.ok;
    if (!ins.ok) console.warn("[prescriptions] insert:", ins.error);
  }

  return { ...dispatch, prescriptionInserted };
}

/** Patient requests refill — flags order for physician review. */
export async function requestPrescriptionRefill(
  orderNumber: string,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = useAuthStore.getState().user;
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase
    .from("orders")
    .update({
      status: "refill_eligible",
      doctor_note: note
        ? `Refill requested: ${note}`
        : "Patient requested prescription refill via portal.",
      urgent: true,
    })
    .eq("order_number", orderNumber)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  try {
    await supabase.from("notifications").insert([
      {
        user_id: user.id,
        type: "prescription",
        title: "Refill request submitted",
        message: "Your care team will review your refill request shortly.",
        read: false,
      },
    ]);
  } catch {
    /* notifications table optional */
  }

  return { ok: true };
}

/** Open printable prescription summary (browser print → PDF). */
export function openPrescriptionPdf(rx: PrescriptionRecord, doctorLabel?: string): void {
  const doctor = doctorLabel || rx.doctor_name || "Licensed Physician";
  const issued = rx.created_at
    ? new Date(rx.created_at).toLocaleDateString("en-US", { dateStyle: "long" })
    : new Date().toLocaleDateString("en-US", { dateStyle: "long" });

  const bodyHtml = `
  <h2 style="font-size:1rem;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Prescription Record</h2>
  <p style="font-size:0.85rem;color:#475569;margin-bottom:20px;">Issued ${issued} · Status: ${rx.status}</p>
  <div style="border:1px solid #d1fae5;border-radius:12px;padding:20px;background:#f0fdf4;">
    <p style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;color:#64748b;margin:0;">Medication</p>
    <p style="font-size:1.1rem;font-weight:700;margin:4px 0 16px;">${rx.medication}</p>
    <p style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;color:#64748b;margin:0;">Dosage / Sig</p>
    <p style="font-size:1.1rem;font-weight:700;margin:4px 0 16px;">${rx.dosage}${rx.frequency ? ` · ${rx.frequency}` : ""}</p>
    <p style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;color:#64748b;margin:0;">Pharmacy</p>
    <p style="font-size:1.1rem;font-weight:700;margin:4px 0 16px;">${rx.pharmacy_name || "Partner pharmacy"}</p>
    <p style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;color:#64748b;margin:0;">Refills remaining</p>
    <p style="font-size:1.1rem;font-weight:700;margin:4px 0 16px;">${rx.refills_remaining ?? 0}</p>
    <p style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;color:#64748b;margin:0;">Prescriber</p>
    <p style="font-size:1.1rem;font-weight:700;margin:4px 0 0;">${doctor}</p>
  </div>
  <p style="margin-top:24px;font-size:0.75rem;color:#94a3b8;">For patient records. Not valid as a paper prescription without pharmacy verification.</p>`;

  void logPhiAccess({
    action: "print",
    resourceType: "prescription",
    resourceId: rx.id,
    subjectUserId: rx.patient_id,
    detail: { medication: rx.medication },
  });

  const ok = openBrandedPrintDocument({
    documentTitle: `Prescription — ${rx.medication}`,
    bodyHtml,
  });
  if (!ok) {
    alert("Allow pop-ups to download or print your prescription PDF.");
  }
}

/** Enrich prescriptions with doctor names from profiles. */
export async function fetchPatientPrescriptionsEnriched(
  patientId: string,
): Promise<PrescriptionRecord[]> {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const rows = (data || []) as PrescriptionRecord[];
  const doctorIds = [...new Set(rows.map((r) => r.doctor_id).filter(Boolean))] as string[];

  if (!doctorIds.length) return rows;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", doctorIds);

  const nameById = new Map<string, string>();
  for (const p of profiles || []) {
    const row = p as { id: string; full_name?: string };
    nameById.set(row.id, row.full_name ? (row.full_name.startsWith("Dr.") ? row.full_name : `Dr. ${row.full_name}`) : "Attending Physician");
  }

  return rows.map((r) => ({
    ...r,
    doctor_name: r.doctor_id ? nameById.get(r.doctor_id) || null : null,
  }));
}
