/**
 * dispatch-prescription — Supabase Edge Function
 *
 * Called by the frontend (Doctor Queue) when a doctor clicks "Finalize & Approve".
 * Wires authentication guards, JWT validation, and professional HIPAA role audits.
 *
 * Pharmacy routing:
 *   pharmacy === "pmci"       → structured plain-text email to PMCI Hub mailbox
 *   pharmacy === "thrivewell" → REST API call to ThriveWell Rx (controlled / non-controlled)
 *   pharmacy === *            → legacy REST pharmacy API (Truepill-compatible)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const PHARMACY_API_URL   = Deno.env.get("PHARMACY_API_URL") ?? "";
const PHARMACY_API_KEY   = Deno.env.get("PHARMACY_API_KEY") ?? "";

// PMCI Hub email integration env vars
const PMCI_MAILBOX       = Deno.env.get("PMCI_MAILBOX") ?? "";         // e.g. orders@pmcihub.com
const PMCI_FROM_EMAIL    = Deno.env.get("PMCI_FROM_EMAIL") ?? "";      // e.g. rx@peak-health.io
const PMCI_SUBJECT_PREFIX = Deno.env.get("PMCI_SUBJECT_PREFIX") ?? "Peak Health Prescription Order Submission";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, accept, accept-profile, prefer, x-region, x-brand-id",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  // CORS preflight — must return 2xx before POST (browser blocks on 401/404 from gateway)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // --------------- 1. Authenticate Request & Enforce Clinical Roles ---------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Access Denied: Missing authorization headers" }, 401);
    }

    // Initialize user-scoped client to securely read their roles
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized: Invalid clinical session" }, 401);
    }

    // Retrieve verified account role from profiles
    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const allowedClinicalRoles = ["doctor", "super_admin"];
    if (profileError || !profile || !allowedClinicalRoles.includes(profile.role)) {
      return jsonResponse(
        { error: "Forbidden: Only clinical doctors and super-admins can authorize medical prescriptions" },
        403,
      );
    }

    // --------------- 2. Parse Clinical Intake Payload ---------------
    let body: Record<string, any>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { order_id, order_number, dosage_instructions, doctor_note, pharmacy = "truepill", prescription_pdf_b64 } = body;
    const orderKey = order_id || order_number;

    if (!orderKey) {
      return jsonResponse({ error: "Missing required parameter: order_id or order_number" }, 400);
    }

    // Initialize service client with elevated keys to read full PHI order records
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let orderQuery = serviceClient.from("orders").select("*");
    orderQuery = uuidLike.test(String(orderKey))
      ? orderQuery.eq("id", orderKey)
      : orderQuery.eq("order_number", orderKey);

    const { data: order, error: fetchErr } = await orderQuery.single();

    if (fetchErr || !order) {
      console.error("dispatch-prescription: order not found", fetchErr);
      return jsonResponse({ error: "Order not found" }, 404);
    }

    // --------------- 3. Dispatch to Approved Pharmacy ---------------
    const patientFullName = order.patient_name ?? "";
    const patientFirstName = patientFullName.split(" ")[0] || "Patient";
    const patientLastName  = patientFullName.split(" ").slice(1).join(" ") || "";

    let pharmacyConfirmationId: string | null = null;
    let pharmacyDispatchSuccess = false;
    let dlNumber: string | undefined = undefined;
    let dlState: string | undefined = undefined;
    let isControlled = false;

    // ── 3a. PMCI Hub — email-based submission ───────────────────────────────
    if (pharmacy === "pmci") {

      // Build PMCI-compliant plain-text email body.
      // Field labels and order match the PMCI Partner Brief exactly.
      const shippingParts = [
        order.shipping_address_line1,
        order.shipping_address_line2,
        order.shipping_city,
        order.shipping_state,
        order.shipping_zip,
      ].filter(Boolean).join(", ");

      const pmciEmailBody = [
        `Order Id: ${order.order_number}`,
        `Rx Number: ${order.order_number}`,
        `Patient name: ${patientFirstName} ${patientLastName}`.trim(),
        `Patient date of birth: ${order.patient_dob ?? ""}`,
        order.patient_phone ? `Phone: ${order.patient_phone}` : null,
        shippingParts       ? `Ship To: ${shippingParts}`    : null,
        order.urgent        ? `Method: Overnight`            : `Method: Standard Ground`,
        `Billing: Bill to Clinic`,
        `Medication: ${order.medication ?? ""}`,
        order.quantity      ? `Quantity: ${order.quantity}`   : null,
        order.prescriber_name ? `Prescriber: ${order.prescriber_name}` : null,
        (dosage_instructions || order.dosage_instructions)
          ? `Notes: ${dosage_instructions || order.dosage_instructions}`
          : null,
        doctor_note
          ? `Reason: ${doctor_note}`
          : null,
      ]
        .filter((line): line is string => line !== null && line.trim() !== "")
        .join("\n");

      if (!PMCI_MAILBOX || !PMCI_FROM_EMAIL) {
        // Staging simulation — no email sent, but we still advance the status
        console.warn(
          "[dispatch-prescription] PMCI env vars not set — simulating PMCI email dispatch for staging."
        );
        pharmacyConfirmationId = `PMCI-SIMULATED-${Date.now()}`;
        pharmacyDispatchSuccess = true;
      } else {
        // Call the existing email-trigger edge function to send the email.
        // This keeps email infrastructure centralised and avoids duplicating
        // SMTP credentials across multiple functions.
        try {
          const emailRes = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/email-trigger`,
            {
              method: "POST",
              headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""}`,
              },
              body: JSON.stringify({
                to:      PMCI_MAILBOX,
                from:    PMCI_FROM_EMAIL,
                subject: PMCI_SUBJECT_PREFIX,
                text:    pmciEmailBody,
                // html intentionally omitted — PMCI requires plain text
              }),
            }
          );

          if (emailRes.ok) {
            pharmacyConfirmationId = `PMCI-EMAIL-${order.order_number}-${Date.now()}`;
            pharmacyDispatchSuccess = true;
            console.log(
              `✅ [dispatch-prescription] PMCI email dispatched for order ${order.order_number} → ${PMCI_MAILBOX}`
            );
          } else {
            const errText = await emailRes.text();
            console.error(
              `[dispatch-prescription] PMCI email-trigger error ${emailRes.status}: ${errText}`
            );
          }
        } catch (emailErr) {
          console.error("[dispatch-prescription] PMCI email fetch failed:", emailErr);
        }
      }

    // ── 3b. ThriveWell Rx — REST API (controlled / non-controlled auto-routing) ───
    } else if (pharmacy === "thrivewell") {

      let driverLicenseImageB64: string | undefined = undefined;
      isControlled =
        !!order.dea_schedule &&
        ["ii", "iii", "iv", "v", "2", "3", "4", "5"].includes(order.dea_schedule.toLowerCase().trim());

      if (isControlled) {
        // Query identity_verification table for the patient
        const { data: idVerification, error: dlErr } = await serviceClient
          .from("identity_verification")
          .select("driver_license_image_path, driver_license_number, driver_license_state")
          .eq("user_id", order.user_id)
          .maybeSingle();

        if (dlErr) {
          console.error("[dispatch-prescription] Error fetching patient DL info:", dlErr);
        }

        if (idVerification) {
          dlNumber = idVerification.driver_license_number ?? undefined;
          dlState = idVerification.driver_license_state ?? undefined;

          if (idVerification.driver_license_image_path) {
            try {
              // Download from patient-documents bucket
              const { data: fileData, error: downloadErr } = await serviceClient
                .storage
                .from("patient-documents")
                .download(idVerification.driver_license_image_path);

              if (downloadErr) {
                console.error("[dispatch-prescription] Error downloading DL image from storage:", downloadErr);
              } else if (fileData) {
                const arrayBuffer = await fileData.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                driverLicenseImageB64 = encode(uint8Array);
              }
            } catch (storageErr) {
              console.error("[dispatch-prescription] Storage exception reading DL image:", storageErr);
            }
          }
        }
      }

      // Delegate entirely to thrivewell-dispatch edge function.
      // It handles endpoint selection, payload construction, ThriveWell API call,
      // and its own DB writes for thrivewell_* columns.
      // We pass the doctor's JWT forward so thrivewell-dispatch can run its own
      // role check and PHI audit without needing the service key.
      try {
        const twRes = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/thrivewell-dispatch`,
          {
            method: "POST",
            headers: {
              "Content-Type":  "application/json",
              "Authorization": req.headers.get("Authorization") ?? "",
            },
            body: JSON.stringify({
              order_id:            order.id,
              dosage_instructions: dosage_instructions,
              doctor_note:         doctor_note,
              driver_license_image_b64: driverLicenseImageB64,
              prescription_pdf_b64: prescription_pdf_b64,
            }),
          }
        );

        if (twRes.ok) {
          const twData = await twRes.json() as {
            success: boolean;
            pharmacy_confirmation_id?: string | null;
            flow_number?: string | null;
          };
          if (twData.success) {
            pharmacyConfirmationId  = twData.pharmacy_confirmation_id ?? twData.flow_number ?? null;
            pharmacyDispatchSuccess = true;
            console.log(
              `✅ [dispatch-prescription] ThriveWell dispatch succeeded: ` +
              `order="${order.order_number}" confirmation="${pharmacyConfirmationId}"`
            );
          } else {
            console.error("[dispatch-prescription] ThriveWell returned success=false.");
          }
        } else {
          const errBody = await twRes.text();
          console.error(
            `[dispatch-prescription] thrivewell-dispatch error ${twRes.status}: ${errBody}`
          );
        }
      } catch (twErr) {
        console.error("[dispatch-prescription] thrivewell-dispatch fetch failed:", twErr);
      }

    // ── 3c. Legacy REST pharmacy API (Truepill / Alto / Capsule) ────────────
    } else {

      const pharmacyPayload = {
        external_ref: order.order_number,
        patient: {
          first_name:    patientFirstName,
          last_name:     patientLastName,
          email:         order.patient_email ?? "",
          date_of_birth: order.patient_dob   ?? "",
          address: {
            line1:   order.shipping_address_line1 ?? "",
            line2:   order.shipping_address_line2 ?? "",
            city:    order.shipping_city          ?? "",
            state:   order.shipping_state         ?? "",
            zip:     order.shipping_zip           ?? "",
            country: "US",
          },
        },
        prescription: {
          medication:          order.medication,
          dosage_instructions: dosage_instructions || order.dosage_instructions,
          quantity:            order.quantity       ?? 1,
          refills:             order.refills_authorized ?? 5,
          ndc:                 order.ndc_code       ?? "",
          dea_schedule:        order.dea_schedule   ?? "none",
        },
        clinical_notes: doctor_note ?? "",
        priority:       "standard",
        webhook_url:    `${Deno.env.get("SUPABASE_URL")}/functions/v1/pharmacy-webhook`,
      };

      if (PHARMACY_API_URL && PHARMACY_API_KEY) {
        try {
          const pharmacyRes = await fetch(PHARMACY_API_URL, {
            method:  "POST",
            headers: {
              "Content-Type":  "application/json",
              "Authorization": `Bearer ${PHARMACY_API_KEY}`,
            },
            body: JSON.stringify(pharmacyPayload),
          });

          if (pharmacyRes.ok) {
            const pharmacyData     = await pharmacyRes.json();
            pharmacyConfirmationId = pharmacyData?.id ?? pharmacyData?.order_id ?? null;
            pharmacyDispatchSuccess = true;
            console.log(`✅ Pharmacy REST dispatch success: ${pharmacyConfirmationId}`);
          } else {
            const errText = await pharmacyRes.text();
            console.error(`Pharmacy API error ${pharmacyRes.status}: ${errText}`);
          }
        } catch (err) {
          console.error("Pharmacy API fetch failed:", err);
        }
      } else {
        // Dev/Staging simulation
        pharmacyConfirmationId  = `SIMULATED-${Date.now()}`;
        pharmacyDispatchSuccess = true;
        console.warn("PHARMACY_API_URL not set — simulating pharmacy dispatch for staging.");
      }
    }

    // --------------- 4. Write Updates & Cryptographic Audit Logs ---------------
    const dispatchedAt = new Date().toISOString();

    // Build the order update — include pharmacy-specific columns when applicable
    const pharmacyDisplayName =
      pharmacy === "pmci"       ? "PMCI Hub"      :
      pharmacy === "thrivewell" ? "ThriveWell Rx" :
      pharmacy;

    const orderUpdatePayload: Record<string, unknown> = {
      status:                   "rx_sent",
      dosage_instructions:      dosage_instructions || order.dosage_instructions,
      doctor_note:              doctor_note ?? "",
      pharmacy_name:            pharmacyDisplayName,
      pharmacy_confirmation_id: pharmacyConfirmationId,
      pharmacy_dispatched_at:   dispatchedAt,
      rx_dispatched:            pharmacyDispatchSuccess,
    };

    if (pharmacy === "pmci") {
      orderUpdatePayload.pmci_dispatched_at = dispatchedAt;
      orderUpdatePayload.pmci_email_sent    = pharmacyDispatchSuccess;
    }
    if (isControlled && dlNumber && !order.driver_license) {
      orderUpdatePayload.driver_license = dlNumber;
    }
    if (isControlled && dlState && !order.driver_license_state) {
      orderUpdatePayload.driver_license_state = dlState;
    }
    // Note: thrivewell-dispatch writes its own thrivewell_* columns directly.
    // No need to duplicate them here — avoids a race condition on the same row.

    const { error: updateErr } = await serviceClient
      .from("orders")
      .update(orderUpdatePayload)
      .eq("id", order.id);

    if (updateErr) {
      console.error("dispatch-prescription: DB update error", updateErr);
      throw updateErr;
    }

    // Secure operational audit log write
    await serviceClient.from("admin_audit_logs").insert([
      {
        actor_id: user.id,
        actor_email: user.email,
        role: profile.role,
        brand_scope: order.brand_id || "Global",
        action: `Prescription Authorized: ${order.medication}`,
        target_type: "Patient Chart",
        target_id: order.user_id,
        detail: {
          order_id: order.id,
          pharmacy,
          confirmation_id: pharmacyConfirmationId,
          authorized_by_doctor: user.email,
        },
      },
    ]);

    await serviceClient.from("phi_access_logs").insert([
      {
        actor_id: user.id,
        actor_email: user.email,
        role: profile.role,
        brand_scope: order.brand_id || null,
        access_type: "staff",
        action: "update",
        resource_type: "prescription",
        resource_id: order.order_number || order.id,
        subject_user_id: order.user_id,
        route_path: "edge/dispatch-prescription",
        detail: {
          pharmacy,
          pharmacy_confirmation_id: pharmacyConfirmationId,
        },
      },
    ]);

    return jsonResponse(
      {
        success: true,
        pharmacy_dispatched: pharmacyDispatchSuccess,
        pharmacy_confirmation_id: pharmacyConfirmationId,
        new_status: "rx_sent",
      },
      200,
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error(`[HIPAA Security Incident] Prescription dispatch failed: ${message}`);
    return jsonResponse({ error: message }, 500);
  }
});
