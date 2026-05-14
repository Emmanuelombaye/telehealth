/**
 * stripe-attach-order — Attach Peak Health order_number to Stripe PaymentIntent metadata.
 * Call after order insert so webhooks and Stripe Dashboard reconcile charges to orders.
 *
 * POST JSON: { payment_intent_id: string, order_number: string }
 * Headers: Authorization: Bearer <user JWT> (Supabase anon + session)
 *
 * Verifies the order row exists and belongs to the caller before updating Stripe.
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
  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error: userErr,
  } = await supabaseUser.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  }

  let body: { payment_intent_id?: string; order_number?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS });
  }

  const piId = body.payment_intent_id?.trim();
  const orderNumber = body.order_number?.trim();
  if (!piId || !orderNumber) {
    return new Response(JSON.stringify({ error: "payment_intent_id and order_number required" }), {
      status: 400,
      headers: CORS,
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: ord, error: ordErr } = await admin
    .from("orders")
    .select("user_id, stripe_payment_intent_id")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (ordErr || !ord) {
    return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: CORS });
  }
  if (ord.user_id !== user.id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: CORS });
  }
  if (ord.stripe_payment_intent_id && ord.stripe_payment_intent_id !== piId) {
    return new Response(JSON.stringify({ error: "Payment intent mismatch" }), { status: 409, headers: CORS });
  }

  try {
    await stripe.paymentIntents.update(piId, {
      metadata: {
        order_number: orderNumber,
        user_id: user.id,
      },
    });
  } catch (e: any) {
    console.error("[stripe-attach-order]", e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS });
});
