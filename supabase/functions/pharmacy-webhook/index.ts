/**
 * pharmacy-webhook — Supabase Edge Function
 *
 * This endpoint is given to the pharmacy partner (e.g. Truepill, Alto, Capsule).
 * When they ship an order, their system fires a POST request here with the
 * tracking number, carrier, and order reference.
 *
 * We validate the request via a shared HMAC secret, then auto-update the
 * patient's order in Supabase — no manual pharmacy portal needed.
 *
 * Endpoint: POST https://<project>.supabase.co/functions/v1/pharmacy-webhook
 *
 * Required env vars (set in Supabase Dashboard > Edge Functions > Secrets):
 *   PHARMACY_WEBHOOK_SECRET  — shared secret provided by the pharmacy
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const WEBHOOK_SECRET = Deno.env.get("PHARMACY_WEBHOOK_SECRET") ?? "";

// ---------------------------------------------------------------------------
// HMAC-SHA256 signature verification
// The pharmacy includes: X-Pharmacy-Signature: sha256=<hmac_hex>
// We recompute and compare to reject spoofed requests.
// ---------------------------------------------------------------------------
async function verifySignature(body: string, signature: string): Promise<boolean> {
  if (!WEBHOOK_SECRET || !signature) return false;

  const sigValue = signature.replace("sha256=", "");
  const keyBytes = new TextEncoder().encode(WEBHOOK_SECRET);
  const msgBytes = new TextEncoder().encode(body);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const macBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgBytes);
  const macHex = Array.from(new Uint8Array(macBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return macHex === sigValue;
}

// ---------------------------------------------------------------------------
// Map pharmacy event types to Peak Health order statuses
// ---------------------------------------------------------------------------
const STATUS_MAP: Record<string, string> = {
  order_received:    "rx_sent",
  in_production:     "rx_sent",
  shipped:           "shipped",
  out_for_delivery:  "shipped",
  delivered:         "delivered",
  cancelled:         "cancelled",
  refill_due:        "refill_eligible",
};

serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-pharmacy-signature") ?? "";

  // --------------- Signature verification ---------------
  const valid = await verifySignature(rawBody, signature);
  if (!valid) {
    console.error("Pharmacy webhook: invalid signature");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --------------- Parse payload ---------------
  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Expected Payload Shape (Truepill / Alto compatible):
   * {
   *   "event":            "shipped",
   *   "order_id":         "PH-ORDER-123",        // pharmacy's internal ID
   *   "external_ref":     "PEAK-ORDER-456",       // our order_number from dispatch
   *   "tracking_number":  "9400111899223821623119",
   *   "carrier":          "USPS",
   *   "tracking_url":     "https://tools.usps.com/go/TrackConfirmAction?tLabels=...",
   *   "estimated_delivery": "2024-12-10",
   *   "patient_name":     "John Doe",
   *   "medication":       "Semaglutide 1mg/mL",
   *   "pharmacy_name":    "Truepill",
   *   "timestamp":        "2024-12-08T14:32:00Z"
   * }
   */
  const {
    event,
    external_ref,    // This MUST match our orders.order_number
    tracking_number,
    carrier,
    tracking_url,
    estimated_delivery,
    pharmacy_name,
  } = payload;

  if (!external_ref) {
    return new Response(JSON.stringify({ error: "Missing external_ref" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const newStatus = STATUS_MAP[event] ?? null;

  // --------------- Supabase update ---------------
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Build the update object dynamically
  const updatePayload: Record<string, any> = {
    pharmacy_event: event,
    updated_at: new Date().toISOString(),
  };

  if (newStatus) updatePayload.status = newStatus;
  if (tracking_number) updatePayload.tracking_number = tracking_number;
  if (carrier) updatePayload.carrier = carrier;
  if (tracking_url) updatePayload.tracking_url = tracking_url;
  if (estimated_delivery) updatePayload.estimated_delivery = estimated_delivery;
  if (pharmacy_name) updatePayload.pharmacy_name = pharmacy_name;

  const { error, data } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("order_number", external_ref)
    .select("id, patient_id, status")
    .single();

  if (error) {
    console.error("Pharmacy webhook DB error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`✅ Pharmacy webhook processed: order=${external_ref} event=${event} status=${newStatus}`);

  return new Response(
    JSON.stringify({ received: true, order_id: data?.id, new_status: newStatus }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
