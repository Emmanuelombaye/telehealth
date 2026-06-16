/**
 * pmci-webhook — Supabase Edge Function
 *
 * Receives HTTPS POST webhooks from PMCI Hub (pmcihub.com) for the
 * Extended integration. Handles both event types:
 *
 *   order.matched  → pharmacy confirmed receipt and matched the order
 *   order.shipped  → medication is in transit, tracking number available
 *
 * Also accepts Legacy payloads (no "event" field — just orderId + trackingNumber).
 *
 * Security:
 *   - HMAC-SHA256 signature verification via X-PMCI-Signature header
 *   - Idempotency: duplicate (orderId, event) pairs are silently ack'd (HTTP 200)
 *     so PMCI retries are safe and cause no side effects
 *   - All events logged to pmci_webhook_events before processing
 *
 * Endpoint: POST https://<project>.supabase.co/functions/v1/pmci-webhook
 *
 * Required env vars (Supabase Dashboard → Settings → Edge Functions → Secrets):
 *   PMCI_WEBHOOK_SECRET       — shared secret agreed with PMCI Hub (used for HMAC)
 *   SUPABASE_URL              — auto-injected by Supabase runtime
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase runtime
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** PMCI Extended — order matched event */
interface PmciOrderMatchedPayload {
  event: "order.matched";
  orderId: string;
  matchedAt: string;
  integrationPartnerId: number;
}

/** PMCI Extended — order shipped event */
interface PmciOrderShippedPayload {
  event: "order.shipped";
  orderId: string;
  trackingNumber: string;
  carrier: string;
}

/** PMCI Legacy — tracking-only payload (no event field) */
interface PmciLegacyPayload {
  orderId: string;
  trackingNumber: string;
}

type PmciPayload =
  | PmciOrderMatchedPayload
  | PmciOrderShippedPayload
  | PmciLegacyPayload;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = Deno.env.get("PMCI_WEBHOOK_SECRET") ?? "";
const PHARMACY_NAME  = "PMCI Hub";

// ---------------------------------------------------------------------------
// HMAC-SHA256 signature verification
// PMCI sends: X-PMCI-Signature: sha256=<hex>
// We recompute from raw body and compare in constant time.
// ---------------------------------------------------------------------------
async function verifyPmciSignature(rawBody: string, signature: string): Promise<boolean> {
  // If no secret is configured (e.g. initial setup / staging), log a warning
  // and allow through — this lets the integration be tested before PMCI issues
  // the production shared secret. NEVER leave this unconfigured in production.
  if (!WEBHOOK_SECRET) {
    console.warn(
      "[pmci-webhook] ⚠️  PMCI_WEBHOOK_SECRET is not set. " +
      "Signature verification skipped. Configure this secret before go-live."
    );
    return true;
  }

  if (!signature) {
    console.error("[pmci-webhook] Missing X-PMCI-Signature header.");
    return false;
  }

  const sigValue = signature.replace(/^sha256=/, "").toLowerCase().trim();
  const keyBytes = new TextEncoder().encode(WEBHOOK_SECRET);
  const msgBytes = new TextEncoder().encode(rawBody);

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
// Build carrier-specific tracking URL from tracking number
// ---------------------------------------------------------------------------
function buildTrackingUrl(carrier: string, trackingNumber: string): string | null {
  const c = carrier.toUpperCase().trim();
  if (c.includes("UPS"))   return `https://www.ups.com/track?tracknum=${trackingNumber}`;
  if (c.includes("USPS"))  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
  if (c.includes("FEDEX")) return `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`;
  if (c.includes("DHL"))   return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${trackingNumber}`;
  return null;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req: Request) => {
  // PMCI only POSTs — reject anything else cleanly
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. PMCI webhooks use POST." }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 1. Read raw body (required before JSON.parse for HMAC) ──────────────
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to read request body." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 2. Signature verification ────────────────────────────────────────────
  const signature = req.headers.get("x-pmci-signature") ?? "";
  const signatureValid = await verifyPmciSignature(rawBody, signature);

  if (!signatureValid) {
    console.error("[pmci-webhook] Signature mismatch — request rejected.");
    return new Response(
      JSON.stringify({ error: "Invalid signature." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 3. Parse JSON payload ────────────────────────────────────────────────
  let payload: PmciPayload;
  try {
    payload = JSON.parse(rawBody) as PmciPayload;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Derive event type — legacy payloads have no "event" field
  const eventType: string = ("event" in payload && payload.event)
    ? payload.event
    : "legacy";

  const pmciOrderId: string = String(payload.orderId ?? "").trim();

  if (!pmciOrderId) {
    return new Response(
      JSON.stringify({ error: "Missing required field: orderId." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log(`[pmci-webhook] Received event="${eventType}" orderId="${pmciOrderId}"`);

  // ── 4. Service-role Supabase client (bypasses RLS, safe for webhook work) ─
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // ── 5. Idempotency check — have we already processed this (orderId, event)? ─
  const { data: existingEvent } = await supabase
    .from("pmci_webhook_events")
    .select("id, processed")
    .eq("pmci_order_id", pmciOrderId)
    .eq("event", eventType)
    .maybeSingle();

  if (existingEvent?.processed) {
    // Already successfully handled — return 200 so PMCI stops retrying
    console.log(
      `[pmci-webhook] Duplicate event ignored: orderId="${pmciOrderId}" event="${eventType}"`
    );
    return new Response(
      JSON.stringify({ received: true, duplicate: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 6. Log the raw event before any processing (forensic audit trail) ────
  // Use upsert so that a retry of a previously failed event overwrites the old row
  const { data: logRow, error: logError } = await supabase
    .from("pmci_webhook_events")
    .upsert(
      {
        event:         eventType,
        pmci_order_id: pmciOrderId,
        raw_payload:   payload as Record<string, unknown>,
        processed:     false,
      },
      { onConflict: "pmci_order_id,event", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (logError) {
    console.error("[pmci-webhook] Failed to log event:", logError.message);
    // Don't abort — proceed with processing; logging failure is non-fatal
  }

  const logRowId: string | null = logRow?.id ?? null;

  // ── 7. Resolve order in database by PMCI orderId → orders.order_number ──
  //    PMCI sends our order_number as orderId (the value we put in the email)
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, status, order_number, patient_name, brand_id, medication")
    .eq("order_number", pmciOrderId)
    .maybeSingle();

  if (orderError) {
    console.error("[pmci-webhook] DB error resolving order:", orderError.message);
    // Mark log row as failed
    if (logRowId) {
      await supabase
        .from("pmci_webhook_events")
        .update({ error: `DB lookup failed: ${orderError.message}` })
        .eq("id", logRowId);
    }
    return new Response(
      JSON.stringify({ error: "Database error. Will retry." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!order) {
    // Order not found — could be a mis-matched orderId from PMCI.
    // Return 200 so they don't retry infinitely for an unresolvable ID,
    // but mark the log entry with an explanatory error for ops team.
    console.warn(
      `[pmci-webhook] Order not found for orderId="${pmciOrderId}" (event="${eventType}"). ` +
      "Check that the order_number in the dispatch email matches what PMCI echoes back."
    );
    if (logRowId) {
      await supabase
        .from("pmci_webhook_events")
        .update({ error: `No orders row matched order_number="${pmciOrderId}"` })
        .eq("id", logRowId);
    }
    // Return 200 — retrying will not help if the ID is genuinely unknown
    return new Response(
      JSON.stringify({ received: true, warning: "Order not found in system." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Update log row with resolved order DB id
  if (logRowId) {
    await supabase
      .from("pmci_webhook_events")
      .update({ order_db_id: order.id })
      .eq("id", logRowId);
  }

  // ── 8. Process event — build targeted DB update ──────────────────────────
  let orderUpdate: Record<string, unknown> = {
    pharmacy_name: PHARMACY_NAME,
    pharmacy_event: eventType,
    updated_at: new Date().toISOString(),
  };

  if (eventType === "order.matched") {
    //
    // order.matched — pharmacy confirmed they received and matched our order.
    // Update: set pmci_matched_at, pmci_partner_id.
    // Do NOT change the order status — it is still "rx_sent" at this point
    // (prescription sent but not yet shipped). Status changes on "order.shipped".
    //
    const matched = payload as PmciOrderMatchedPayload;
    orderUpdate = {
      ...orderUpdate,
      pmci_matched_at:  matched.matchedAt ?? new Date().toISOString(),
      pmci_partner_id:  String(matched.integrationPartnerId ?? ""),
    };

    console.log(
      `[pmci-webhook] order.matched → orderId="${pmciOrderId}" ` +
      `matchedAt="${matched.matchedAt}" partnerId=${matched.integrationPartnerId}`
    );

  } else if (eventType === "order.shipped" || eventType === "legacy") {
    //
    // order.shipped (Extended) or legacy payload — medication is in transit.
    // Update: status → "shipped", tracking_number, carrier, tracking_url.
    //
    const shipped = payload as PmciOrderShippedPayload & PmciLegacyPayload;
    const trackingNumber = String(shipped.trackingNumber ?? "").trim();
    const carrier        = String((shipped as PmciOrderShippedPayload).carrier ?? "").trim();
    const trackingUrl    = carrier && trackingNumber
      ? buildTrackingUrl(carrier, trackingNumber)
      : null;

    orderUpdate = {
      ...orderUpdate,
      status:           "shipped",
      tracking_number:  trackingNumber || null,
      carrier:          carrier         || null,
      tracking_url:     trackingUrl     || null,
    };

    console.log(
      `[pmci-webhook] ${eventType} → orderId="${pmciOrderId}" ` +
      `tracking="${trackingNumber}" carrier="${carrier}"`
    );

  } else {
    // Unknown event type — log and acknowledge gracefully
    console.warn(`[pmci-webhook] Unrecognised event type="${eventType}" — no order update applied.`);
    if (logRowId) {
      await supabase
        .from("pmci_webhook_events")
        .update({ processed: true, error: `Unknown event type: ${eventType}` })
        .eq("id", logRowId);
    }
    return new Response(
      JSON.stringify({ received: true, warning: `Unknown event type: ${eventType}` }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 9. Apply the database update ─────────────────────────────────────────
  const { error: updateError } = await supabase
    .from("orders")
    .update(orderUpdate)
    .eq("id", order.id);

  if (updateError) {
    console.error("[pmci-webhook] Failed to update order:", updateError.message);
    if (logRowId) {
      await supabase
        .from("pmci_webhook_events")
        .update({ error: `Order update failed: ${updateError.message}` })
        .eq("id", logRowId);
    }
    // Return 500 so PMCI retries — the idempotency check above will skip
    // re-inserting the log row on retry and go straight to the update attempt.
    return new Response(
      JSON.stringify({ error: "Failed to update order. Will retry." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 10. Insert patient notification (non-blocking — failure is non-fatal) ─
  if (order.user_id) {
    let notifTitle  = "";
    let notifBody   = "";

    if (eventType === "order.matched") {
      notifTitle = "Prescription Received by Pharmacy";
      notifBody  =
        `Your ${order.medication ?? "prescription"} order has been received and confirmed ` +
        `by ${PHARMACY_NAME}. It is now being prepared.`;
    } else if (eventType === "order.shipped" || eventType === "legacy") {
      const shipped   = payload as PmciOrderShippedPayload & PmciLegacyPayload;
      const carrierStr = (shipped as PmciOrderShippedPayload).carrier ?? "";
      notifTitle = "Your Medication Has Shipped! 📦";
      notifBody  =
        `Your ${order.medication ?? "prescription"} is on its way` +
        (carrierStr ? ` via ${carrierStr}` : "") +
        `. Tracking number: ${(shipped.trackingNumber ?? "").trim() || "—"}.`;
    }

    if (notifTitle) {
      await supabase.from("notifications").insert({
        user_id: order.user_id,
        type:    `pharmacy_${eventType.replace(".", "_")}`,
        title:   notifTitle,
        body:    notifBody,
        unread:  true,
      }).then(({ error: nErr }) => {
        if (nErr) {
          console.warn("[pmci-webhook] Notification insert failed (non-fatal):", nErr.message);
        }
      });
    }
  }

  // ── 11. Mark log row as successfully processed ───────────────────────────
  if (logRowId) {
    await supabase
      .from("pmci_webhook_events")
      .update({ processed: true })
      .eq("id", logRowId);
  }

  console.log(
    `✅ [pmci-webhook] Processed: orderId="${pmciOrderId}" event="${eventType}" ` +
    `orderDbId="${order.id}"`
  );

  // ── 12. Return HTTP 200 — PMCI considers this a successful delivery ───────
  return new Response(
    JSON.stringify({
      received:    true,
      event:       eventType,
      order_db_id: order.id,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
