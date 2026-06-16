/**
 * thrivewell-dispatch — Supabase Edge Function
 *
 * Submits approved prescriptions to the ThriveWell Rx External Prescription API.
 * Called from dispatch-prescription when pharmacy === "thrivewell".
 *
 * Automatically routes to the correct ThriveWell endpoint:
 *   /prescription/controlled      — for scheduled (controlled) substances
 *   /prescription/non-controlled  — for all other medications
 *
 * The routing decision is based on orders.dea_schedule:
 *   "II", "III", "IV", "V"  →  controlled endpoint (requires driver_license + PDF)
 *   "none" or absent         →  non-controlled endpoint
 *
 * Authentication: HTTP Basic Auth (THRIVEWELL_USERNAME : THRIVEWELL_PASSWORD)
 *
 * Endpoint: POST https://<project>.supabase.co/functions/v1/thrivewell-dispatch
 *
 * Required env vars (Supabase Dashboard → Settings → Edge Functions → Secrets):
 *   THRIVEWELL_USERNAME          — clinic username from ThriveWell pharmacy contact
 *   THRIVEWELL_PASSWORD          — clinic password from ThriveWell pharmacy contact
 *   THRIVEWELL_BASE_URL          — https://flow.thrivewellrx.com/api  (or staging URL)
 *   SUPABASE_URL                 — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY    — auto-injected
 *   SUPABASE_ANON_KEY            — auto-injected
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const THRIVEWELL_BASE_URL = (Deno.env.get("THRIVEWELL_BASE_URL") ?? "https://flow.thrivewellrx.com/api")
  .replace(/\/$/, "");
const THRIVEWELL_USERNAME = Deno.env.get("THRIVEWELL_USERNAME") ?? "";
const THRIVEWELL_PASSWORD = Deno.env.get("THRIVEWELL_PASSWORD") ?? "";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Build Basic Auth header from credentials. */
function buildBasicAuth(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

/** Determine ThriveWell endpoint from DEA schedule. */
function resolveEndpoint(deaSchedule: string | null | undefined): "controlled" | "non-controlled" {
  const controlled = ["ii", "iii", "iv", "v", "2", "3", "4", "5"];
  return controlled.includes((deaSchedule ?? "").toLowerCase().trim())
    ? "controlled"
    : "non-controlled";
}

/** Format phone number to plain digits + parentheses style accepted by ThriveWell. */
function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    // ── 1. Authenticate the caller — must be a doctor or super_admin ─────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header." }, 401);
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized: Invalid session." }, 401);
    }

    const { data: callerProfile } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!callerProfile || !["doctor", "super_admin"].includes(callerProfile.role)) {
      return jsonResponse({ error: "Forbidden: Clinical role required." }, 403);
    }

    // ── 2. Parse request body ─────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body." }, 400);
    }

    const {
      order_id,
      order_number,
      dosage_instructions,
      doctor_note,
      // Optional overrides from the caller (doctor can provide these in the UI)
      driver_license_image_b64,   // Base64 string — required for controlled substances
      prescription_pdf_b64,       // Base64 PDF  — required for controlled substances
    } = body as {
      order_id?: string;
      order_number?: string;
      dosage_instructions?: string;
      doctor_note?: string;
      driver_license_image_b64?: string;
      prescription_pdf_b64?: string;
    };

    const orderKey = order_id || order_number;
    if (!orderKey) {
      return jsonResponse({ error: "Missing required field: order_id or order_number." }, 400);
    }

    // ── 3. Load full order + patient data ─────────────────────────────────────
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let orderQuery = serviceClient.from("orders").select("*");
    orderQuery = uuidLike.test(String(orderKey))
      ? orderQuery.eq("id", orderKey)
      : orderQuery.eq("order_number", orderKey);

    const { data: order, error: orderErr } = await orderQuery.single();
    if (orderErr || !order) {
      return jsonResponse({ error: "Order not found." }, 404);
    }

    // ── 4. Load prescribing doctor profile (NPI, DEA, address) ───────────────
    // Prefer the doctor assigned to this order; fall back to the calling doctor.
    const doctorId = order.doctor_id || user.id;

    const { data: doctorProfile } = await serviceClient
      .from("profiles")
      .select("first_name, last_name, provider_npi, provider_dea, provider_address_line1, provider_address_line2, provider_city, provider_state, provider_zip")
      .eq("id", doctorId)
      .maybeSingle();

    // ── 5. Decide endpoint based on DEA schedule ──────────────────────────────
    const endpointType = resolveEndpoint(order.dea_schedule as string | null);
    const apiUrl = `${THRIVEWELL_BASE_URL}/prescription/${endpointType}`;

    console.log(
      `[thrivewell-dispatch] order="${order.order_number}" ` +
      `endpoint="${endpointType}" dea_schedule="${order.dea_schedule ?? "none"}"`
    );

    // ── 6. Build the patient name parts ──────────────────────────────────────
    const fullName      = String(order.patient_name ?? "").trim();
    const nameParts     = fullName.split(" ").filter(Boolean);
    const patientFirst  = nameParts[0] ?? "Patient";
    const patientLast   = nameParts.slice(1).join(" ") || patientFirst;

    // ── 7. Build prescription_items array ────────────────────────────────────
    const prescriptionItems = [{
      medication_code:  String(order.medication_code ?? order.ndc_code ?? ""),
      medication_sig:   String(dosage_instructions ?? order.dosage_instructions ?? "As directed by prescriber"),
      medication_quantity: Number(order.quantity ?? 1),
      days_supply:      Number(order.days_supply ?? 30),
      refills:          order.refills_authorized ?? 0,
      pref_packaging:   "standard",
      treatment_type:   "Chronic",
      non_child_resistant_acknowledgment: "No",
      ...(order.diagnosis ? { treatment_type: "Chronic" } : {}),
      notes: doctor_note ?? undefined,
      ...(endpointType === "controlled" ? {
        prescribing_doctor: {
          provider_npi: doctorProfile?.provider_npi ?? "",
          first_name:   doctorProfile?.first_name   ?? "",
          last_name:    doctorProfile?.last_name     ?? "",
          address_1:    doctorProfile?.provider_address_line1 ?? "",
          address_2:    doctorProfile?.provider_address_line2 ?? null,
          city:         doctorProfile?.provider_city  ?? "",
          state:        doctorProfile?.provider_state ?? "",
          zip_code:     doctorProfile?.provider_zip   ?? "",
          country:      "USA",
        },
      } : {}),
    }];

    // ── 8. Build the full API payload ─────────────────────────────────────────
    let payload: Record<string, unknown>;

    if (endpointType === "controlled") {
      // Validate controlled-specific required fields
      if (!order.driver_license && !doctor_note) {
        console.warn("[thrivewell-dispatch] driver_license missing for controlled substance.");
      }

      payload = {
        masterId:              String(order.order_number ?? order.id),
        notes:                 doctor_note ?? `Prescription for ${order.medication}`,
        // Patient info
        patient_first_name:   patientFirst,
        patient_last_name:    patientLast,
        patient_cell_phone:   formatPhone(order.patient_phone as string | null),
        patient_email:        order.patient_email ?? "",
        date_of_birth:        order.patient_dob   ?? "",
        patient_gender:       order.patient_gender ?? "Other",
        // Shipping address
        address_1:            order.shipping_address_line1 ?? "",
        address_2:            order.shipping_address_line2 ?? null,
        city:                 order.shipping_city          ?? "",
        state:                order.shipping_state         ?? "",
        zip_code:             order.shipping_zip           ?? "",
        country:              "USA",
        // Allergy / meds
        allergy_information:       order.allergy_information       ?? "None",
        patient_other_medications: order.patient_current_medication ?? "None",
        // Prescription items
        prescription_items:   prescriptionItems,
        // Driver's license (required for controlled)
        driver_license:       order.driver_license       ?? "",
        driver_license_state: order.driver_license_state ?? "",
        driver_license_image: driver_license_image_b64   ?? "",  // Base64 JPG/PNG/WEBP
        // Encoded prescription PDF (required for controlled)
        encoded_prescription_pdf: prescription_pdf_b64   ?? "",
      };

    } else {
      // Non-controlled endpoint
      payload = {
        masterId:             String(order.order_number ?? order.id),
        // Appointment / clinical
        appoinment_date:      order.appointment_date ?? new Date().toISOString().slice(0, 10),
        diagnosis:            order.diagnosis        ?? "",
        allergy_information:  order.allergy_information       ?? "None",
        patient_current_medication: order.patient_current_medication ?? "None",
        // Patient info
        patient_first_name:   patientFirst,
        patient_last_name:    patientLast,
        patient_cell_phone:   formatPhone(order.patient_phone as string | null),
        patient_email:        order.patient_email ?? "",
        date_of_birth:        order.patient_dob   ?? "",
        patient_gender:       order.patient_gender ?? "Other",
        // Shipping address
        address_1:            order.shipping_address_line1 ?? "",
        address_2:            order.shipping_address_line2 ?? null,
        city:                 order.shipping_city          ?? "",
        state:                order.shipping_state         ?? "",
        zip_code:             order.shipping_zip           ?? "",
        // Prescriber — flat fields for non-controlled endpoint
        prescriber_first_name: doctorProfile?.first_name   ?? "",
        prescriber_last_name:  doctorProfile?.last_name     ?? "",
        prescriber_npi:        doctorProfile?.provider_npi  ?? "",
        prescriber_dea:        doctorProfile?.provider_dea  ?? "",
        // Prescription items
        prescription_items:    prescriptionItems,
      };
    }

    // ── 9. Simulate in staging if credentials not configured ──────────────────
    if (!THRIVEWELL_USERNAME || !THRIVEWELL_PASSWORD) {
      console.warn(
        "[thrivewell-dispatch] THRIVEWELL_USERNAME/PASSWORD not set — " +
        "simulating successful submission for staging."
      );

      // Write simulated results to DB
      await serviceClient.from("orders").update({
        status:                  "rx_sent",
        dosage_instructions:     dosage_instructions ?? order.dosage_instructions,
        doctor_note:             doctor_note ?? "",
        pharmacy_name:           "ThriveWell Rx",
        thrivewell_type:         endpointType,
        thrivewell_flow_number:  `FLOW-SIM-${Date.now()}`,
        thrivewell_order_id:     `NEWCLINIC-SIM-${Date.now()}`,
        thrivewell_dispatched_at: new Date().toISOString(),
        thrivewell_submitted:    true,
        pharmacy_dispatched_at:  new Date().toISOString(),
        rx_dispatched:           true,
        pharmacy_confirmation_id: `TW-SIM-${order.order_number}`,
      }).eq("id", order.id);

      return jsonResponse({
        success:     true,
        simulated:   true,
        endpoint:    endpointType,
        message:     "Simulated — set THRIVEWELL_USERNAME + THRIVEWELL_PASSWORD in Edge Function secrets for live calls.",
      }, 200);
    }

    // ── 10. Call ThriveWell API ───────────────────────────────────────────────
    let twResponse: Record<string, unknown> | null = null;
    let twError: string | null = null;
    let callSucceeded = false;

    try {
      const twRes = await fetch(apiUrl, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept":        "application/json",
          "Authorization": buildBasicAuth(THRIVEWELL_USERNAME, THRIVEWELL_PASSWORD),
        },
        body: JSON.stringify(payload),
      });

      const rawText = await twRes.text();

      try {
        twResponse = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        twResponse = { raw: rawText };
      }

      if (twRes.ok && twResponse?.status === "success") {
        callSucceeded = true;
        console.log(
          `✅ [thrivewell-dispatch] Success: order="${order.order_number}" ` +
          `endpoint="${endpointType}" status_code=${twRes.status}`
        );
      } else {
        // ThriveWell returned HTTP 2xx but status !== "success", or non-2xx
        twError = String(
          (twResponse as { message?: string })?.message ??
          (twResponse as { raw?: string })?.raw ??
          `HTTP ${twRes.status}`
        );
        console.error(`[thrivewell-dispatch] API error: ${twError}`);
      }
    } catch (fetchErr) {
      twError = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.error("[thrivewell-dispatch] Fetch failed:", twError);
    }

    // ── 11. Extract flow_number + order_id from ThriveWell response ───────────
    // Response shape differs between controlled and non-controlled endpoints.
    const twData = twResponse?.data as
      | { status?: string; order?: string; prescriptions?: Array<{ flow_number?: string; order_id?: string }> }
      | Array<{ flow_number?: string; order_id?: string }>
      | null;

    let flowNumber: string | null = null;
    let twOrderId:  string | null = null;

    if (Array.isArray(twData)) {
      // Non-controlled — data is an array
      flowNumber = twData[0]?.flow_number ?? null;
      twOrderId  = twData[0]?.order_id   ?? null;
    } else if (twData && typeof twData === "object") {
      // Controlled — data is { status, order, prescriptions: [...] }
      const prescriptions = twData.prescriptions ?? [];
      flowNumber = prescriptions[0]?.flow_number ?? null;
      twOrderId  = prescriptions[0]?.order_id   ?? null;
    }

    // ── 12. Persist results to DB ─────────────────────────────────────────────
    const orderUpdatePayload: Record<string, unknown> = {
      dosage_instructions:     dosage_instructions ?? order.dosage_instructions,
      doctor_note:             doctor_note ?? "",
      pharmacy_name:           "ThriveWell Rx",
      thrivewell_type:         endpointType,
      thrivewell_submitted:    callSucceeded,
      pharmacy_dispatched_at:  new Date().toISOString(),
    };

    if (callSucceeded) {
      orderUpdatePayload.status                  = "rx_sent";
      orderUpdatePayload.thrivewell_flow_number  = flowNumber;
      orderUpdatePayload.thrivewell_order_id     = twOrderId;
      orderUpdatePayload.thrivewell_dispatched_at = new Date().toISOString();
      orderUpdatePayload.rx_dispatched           = true;
      orderUpdatePayload.pharmacy_confirmation_id = flowNumber ?? `TW-${order.order_number}`;
    } else {
      orderUpdatePayload.thrivewell_error = twError;
      orderUpdatePayload.rx_dispatched    = false;
    }

    await serviceClient.from("orders").update(orderUpdatePayload).eq("id", order.id);

    // ── 13. Write audit logs ──────────────────────────────────────────────────
    await serviceClient.from("admin_audit_logs").insert([{
      actor_id:    user.id,
      actor_email: user.email,
      role:        callerProfile.role,
      brand_scope: order.brand_id ?? "Global",
      action:      callSucceeded
        ? `ThriveWell Rx Dispatched (${endpointType}): ${order.medication}`
        : `ThriveWell Rx Dispatch FAILED (${endpointType}): ${order.medication}`,
      target_type: "Patient Chart",
      target_id:   order.user_id,
      detail: {
        order_id:         order.id,
        order_number:     order.order_number,
        thrivewell_endpoint: endpointType,
        flow_number:      flowNumber,
        thrivewell_order_id: twOrderId,
        error:            twError,
        authorized_by:    user.email,
      },
    }]);

    await serviceClient.from("phi_access_logs").insert([{
      actor_id:       user.id,
      actor_email:    user.email,
      role:           callerProfile.role,
      brand_scope:    order.brand_id ?? null,
      access_type:    "staff",
      action:         "update",
      resource_type:  "prescription",
      resource_id:    order.order_number ?? order.id,
      subject_user_id: order.user_id,
      route_path:     "edge/thrivewell-dispatch",
      detail: {
        thrivewell_endpoint: endpointType,
        flow_number:         flowNumber,
        success:             callSucceeded,
      },
    }]);

    // ── 14. Return result ─────────────────────────────────────────────────────
    if (callSucceeded) {
      return jsonResponse({
        success:              true,
        endpoint:             endpointType,
        flow_number:          flowNumber,
        thrivewell_order_id:  twOrderId,
        pharmacy_confirmation_id: flowNumber ?? null,
        new_status:           "rx_sent",
      }, 200);
    } else {
      // Return 500 so dispatch-prescription can decide to use local fallback.
      return jsonResponse({
        success: false,
        endpoint: endpointType,
        error:   twError ?? "ThriveWell API call failed.",
        thrivewell_response: twResponse,
      }, 500);
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[thrivewell-dispatch] Unhandled error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
