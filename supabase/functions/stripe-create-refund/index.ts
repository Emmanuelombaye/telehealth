/**
 * stripe-create-refund — Refund a captured PaymentIntent (e.g. clinical disqualification).
 *
 * POST JSON: { payment_intent_id: string, order_number?: string, reason?: string }
 * Authorization: Bearer <Supabase JWT> — caller must be doctor/super_admin or service (use from Consult with doctor session).
 *
 * For simplicity we verify the order exists and is cancelled, and PI matches order.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  }

  const appMeta = (user as { app_metadata?: { role?: string } }).app_metadata;
  const meta = user.user_metadata || {};
  const role = appMeta?.role || meta.role;
  if (!["doctor", "super_admin", "brand_admin"].includes(role as string)) {
    return new Response(JSON.stringify({ error: "Forbidden — clinical staff only" }), { status: 403, headers: CORS });
  }

  let body: { payment_intent_id?: string; order_number?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS });
  }

  const piId = body.payment_intent_id?.trim();
  const orderNumber = body.order_number?.trim();
  if (!piId) {
    return new Response(JSON.stringify({ error: "payment_intent_id required" }), { status: 400, headers: CORS });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  if (orderNumber) {
    const { data: ord, error: oe } = await admin
      .from("orders")
      .select("stripe_payment_intent_id, status")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (oe || !ord) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: CORS });
    }
    if (ord.status !== "cancelled") {
      return new Response(JSON.stringify({ error: "Order must be cancelled before refund" }), { status: 400, headers: CORS });
    }
    if (ord.stripe_payment_intent_id && ord.stripe_payment_intent_id !== piId) {
      return new Response(JSON.stringify({ error: "PaymentIntent does not match order" }), { status: 409, headers: CORS });
    }
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: piId,
      reason: "requested_by_customer",
      metadata: { peak_health: "clinical_disqualification", order_number: orderNumber || "" },
    });
    if (orderNumber) {
      await admin
        .from("orders")
        .update({ payment_status: "refunded" })
        .eq("order_number", orderNumber);
    }
    return new Response(JSON.stringify({ ok: true, refund_id: refund.id }), { status: 200, headers: CORS });
  } catch (e: any) {
    console.error("[stripe-create-refund]", e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
});
