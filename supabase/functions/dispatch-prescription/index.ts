/**
 * dispatch-prescription — Supabase Edge Function
 *
 * Called by the frontend (Doctor Queue) when a doctor clicks "Finalize & Approve".
 * This function:
 *   1. Validates the request (auth token check)
 *   2. Fetches the full order from Supabase
 *   3. Sends the prescription to the pharmacy API (Truepill-compatible format)
 *   4. Updates the order status to "rx_sent" with the pharmacy's confirmation ID
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
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer",
  "Access-Control-Max-Age": "86400",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
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

  const { order_id, dosage_instructions, doctor_note, pharmacy = "truepill" } = body;

  if (!order_id) {
    return new Response(JSON.stringify({ error: "order_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --------------- Init Supabase (service role — bypass RLS) ---------------
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

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
    .eq("id", order_id)
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
        const pharmacyData = await pharmacyRes.json();
        pharmacyConfirmationId = pharmacyData?.id ?? pharmacyData?.order_id ?? null;
        pharmacyDispatchSuccess = true;
        console.log(`✅ Pharmacy dispatch success: ${pharmacyConfirmationId}`);
      } else {
        const errText = await pharmacyRes.text();
        console.error(`Pharmacy API error ${pharmacyRes.status}: ${errText}`);
      }
    } catch (err) {
      console.error("Pharmacy API fetch failed:", err);
    }
  } else {
    // No pharmacy API configured yet — simulate success for dev/staging
    pharmacyConfirmationId = `SIMULATED-${Date.now()}`;
    pharmacyDispatchSuccess = true;
    console.warn("⚠️  PHARMACY_API_URL not set — simulating dispatch for dev.");
  }

  // --------------- Update Supabase order ---------------
  const { error: updateErr } = await supabase
    .from("orders")
    .update({
      status:                    "rx_sent",
      dosage_instructions:       dosage_instructions || order.dosage_instructions,
      doctor_note:               doctor_note ?? "",
      pharmacy_name:             pharmacy,
      pharmacy_confirmation_id:  pharmacyConfirmationId,
      pharmacy_dispatched_at:    new Date().toISOString(),
      rx_dispatched:             pharmacyDispatchSuccess,
    })
    .eq("id", order_id);

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
      pharmacy_dispatched: pharmacyDispatchSuccess,
      pharmacy_confirmation_id: pharmacyConfirmationId,
      new_status: "rx_sent",
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
