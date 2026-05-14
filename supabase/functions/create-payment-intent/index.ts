/**
 * create-payment-intent — Supabase Edge Function
 *
 * Creates a Stripe PaymentIntent server-side and returns the client_secret
 * to the frontend so Stripe.js can confirm payment without any card data
 * ever touching our server.
 *
 * POST body (JSON):
 *   { amount: number (cents), currency: string, metadata: object }
 *
 * Env secrets needed (set in Supabase Dashboard → Settings → Edge Functions):
 *   STRIPE_SECRET_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { amount, currency = "usd", metadata = {} } = await req.json();

    if (!amount || typeof amount !== "number" || amount < 50) {
      return new Response(
        JSON.stringify({ error: "Amount must be a number in cents (minimum 50)" }),
        { status: 400, headers: CORS }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // ensure integer cents
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        ...metadata,
        source: "peak_health_shop",
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      { status: 200, headers: CORS }
    );
  } catch (err: any) {
    console.error("[create-payment-intent] Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: CORS }
    );
  }
});
