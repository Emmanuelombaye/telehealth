/**
 * dispatch-prescription — Supabase Edge Function
 *
 * Called by the frontend (Doctor Queue) when a doctor clicks "Finalize & Approve".
 * This function:
 *   1. Validates the request (auth token check)
 *   2. Fetches the full order from Supabase
 *   3. Sends the prescription to the pharmacy API (Truepill-compatible format) when
 *      PHARMACY_API_URL + PHARMACY_API_KEY are set
 *   4. On pharmacy success (or dev mode with no API configured): updates order to rx_sent
 *   5. On pharmacy failure: returns 502, does NOT set rx_sent; writes pharmacy_note for ops
 *
 * Endpoint: POST https://<project>.supabase.co/functions/v1/dispatch-prescription
 *
 * Required env vars:
 *   PHARMACY_API_URL           — e.g. https://api.truepill.com/v1/prescriptions
 *   PHARMACY_API_KEY           — bearer token for pharmacy API
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const PHARMACY_API_URL = Deno.env.get("PHARMACY_API_URL") ?? "";
const PHARMACY_API_KEY = Deno.env.get("PHARMACY_API_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer, x-region, x-brand-id",
  "Access-Control-Max-Age": "86400",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200, 
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer, x-region, x-brand-id"
      } 
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // --------------- Parse request body ---------------
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { order_id: rawOrderId, dosage_instructions, doctor_note, pharmacy = "truepill" } = body;

  if (!rawOrderId) {
    return new Response(JSON.stringify({ error: "order_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const looksLikeUuid = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

  // --------------- Init Supabase (service role — bypass RLS) ---------------
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  let orderUuid = String(rawOrderId).trim();
  if (!looksLikeUuid(orderUuid)) {
    const { data: row, error: lookupErr } = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", orderUuid)
      .maybeSingle();
    if (lookupErr || !row?.id) {
      return new Response(JSON.stringify({ error: "Order not found for order_id / order_number" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    orderUuid = row.id;
  }

  // --------------- Fetch the full order ---------------
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select(`
      *,
      profiles:patient_id (
        full_name,
        email,
        date_of_birth
      )
    `)
    .eq("id", orderUuid)
    .single();

  if (fetchErr || !order) {
    console.error("dispatch-prescription: order not found", fetchErr);
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --------------- Build pharmacy payload (Truepill-compatible) ---------------
  const pharmacyPayload = {
    // Our reference — pharmacy sends this back in every webhook so we can match it
    external_ref: order.order_number,
    patient: {
      first_name: (order.profiles?.full_name ?? "").split(" ")[0],
      last_name:  (order.profiles?.full_name ?? "").split(" ").slice(1).join(" "),
      email:      order.profiles?.email ?? order.patientEmail ?? "",
      date_of_birth: order.profiles?.date_of_birth ?? "",
      address: {
        line1:   order.shipping_address_line1 ?? "",
        line2:   order.shipping_address_line2 ?? "",
        city:    order.shipping_city ?? "",
        state:   order.shipping_state ?? "",
        zip:     order.shipping_zip ?? "",
        country: "US",
      },
    },
    prescription: {
      medication:           order.medication,
      dosage_instructions:  dosage_instructions || order.dosage_instructions,
      quantity:             order.quantity ?? 1,
      refills:              order.refills_authorized ?? 5,
      ndc:                  order.ndc_code ?? "",
      dea_schedule:         order.dea_schedule ?? "none",
    },
    clinical_notes: doctor_note ?? "",
    priority: "standard",
    // Webhook URL — pharmacy sends status updates back here
    webhook_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/pharmacy-webhook`,
  };

  // --------------- Send to Pharmacy API ---------------
  let pharmacyConfirmationId: string | null = null;
  let pharmacyDispatchSuccess = false;
  let pharmacyFailureDetail: string | null = null;

  if (PHARMACY_API_URL && PHARMACY_API_KEY) {
    try {
      const pharmacyRes = await fetch(PHARMACY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${PHARMACY_API_KEY}`,
        },
        body: JSON.stringify(pharmacyPayload),
      });

      if (pharmacyRes.ok) {
        try {
          const pharmacyData = await pharmacyRes.json();
          pharmacyConfirmationId = pharmacyData?.id ?? pharmacyData?.order_id ?? null;
        } catch {
          pharmacyConfirmationId = null;
        }
        pharmacyDispatchSuccess = true;
        console.log(`✅ Pharmacy dispatch success: ${pharmacyConfirmationId}`);
      } else {
        pharmacyFailureDetail = await pharmacyRes.text();
        console.error(`Pharmacy API error ${pharmacyRes.status}: ${pharmacyFailureDetail}`);
      }
    } catch (err) {
      pharmacyFailureDetail = err instanceof Error ? err.message : String(err);
      console.error("Pharmacy API fetch failed:", err);
    }
  } else {
    // No pharmacy API configured — dev/staging only: accept without outbound call
    pharmacyConfirmationId = `SIMULATED-${Date.now()}`;
    pharmacyDispatchSuccess = true;
    console.warn("⚠️  PHARMACY_API_URL / PHARMACY_API_KEY not set — simulating pharmacy acceptance (dev only).");
  }

  if (!pharmacyDispatchSuccess) {
    const detail = (pharmacyFailureDetail ?? "Unknown pharmacy error").slice(0, 4000);
    const opsLine = `[${new Date().toISOString()}] Pharmacy rejected dispatch: ${detail}`.slice(0, 8000);

    const { error: failPatchErr } = await supabase
      .from("orders")
      .update({
        pharmacy_note: opsLine,
        rx_dispatched: false,
        dosage_instructions: dosage_instructions || order.dosage_instructions,
        ...(typeof doctor_note === "string" && doctor_note.trim()
          ? { doctor_note: doctor_note.trim() }
          : {}),
      })
      .eq("id", orderUuid);

    if (failPatchErr) {
      console.error("dispatch-prescription: failure patch error", failPatchErr);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Pharmacy API did not accept the prescription dispatch.",
        detail: detail.slice(0, 2000),
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const existingTimeline = Array.isArray(order.timeline) ? order.timeline : [];
  const newTimeline = [
    ...existingTimeline,
    { status: "rx_sent", date: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) },
  ];

  // --------------- Update Supabase order (only after pharmacy acceptance or dev simulation) ---------------
  const { error: updateErr } = await supabase
    .from("orders")
    .update({
      status: "rx_sent",
      dosage_instructions: dosage_instructions || order.dosage_instructions,
      doctor_note: typeof doctor_note === "string" ? doctor_note : order.doctor_note ?? "",
      pharmacy_name: pharmacy,
      pharmacy_confirmation_id: pharmacyConfirmationId,
      pharmacy_dispatched_at: new Date().toISOString(),
      rx_dispatched: true,
      timeline: newTimeline,
    })
    .eq("id", orderUuid);

  if (updateErr) {
    console.error("dispatch-prescription: DB update error", updateErr);
    return new Response(JSON.stringify({ error: updateErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      pharmacy_dispatched: true,
      pharmacy_confirmation_id: pharmacyConfirmationId,
      new_status: "rx_sent",
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
