/**
 * stripe-identity-webhook — Supabase Edge Function
 *
 * Handles Stripe Identity webhook events to update kyc_status on orders.
 *
 * Events handled:
 *   identity.verification_session.verified   → kyc_status = 'verified'
 *   identity.verification_session.requires_input → kyc_status = 'failed'
 *
 * Env secrets needed:
 *   STRIPE_SECRET_KEY
 *   STRIPE_IDENTITY_WEBHOOK_SECRET   (different from payment webhook secret)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_IDENTITY_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("[stripe-identity-webhook] Signature error:", err.message);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const session = event.data.object as Stripe.Identity.VerificationSession;
  const orderId = session.metadata?.order_id;
  const userId  = session.metadata?.user_id;

  switch (event.type) {
    case "identity.verification_session.verified": {
      console.log(`[KYC] Verified — order: ${orderId}, user: ${userId}`);
      if (orderId) {
        await supabase
          .from("orders")
          .update({ kyc_status: "verified" })
          .eq("order_number", orderId);
      }
      if (userId) {
        // Also stamp the profile
        await supabase
          .from("profiles")
          .update({ kyc_verified: true })
          .eq("id", userId);
      }
      break;
    }

    case "identity.verification_session.requires_input": {
      console.log(`[KYC] Failed — order: ${orderId}, user: ${userId}`);
      if (orderId) {
        await supabase
          .from("orders")
          .update({ kyc_status: "failed" })
          .eq("order_number", orderId);
      }
      break;
    }

    default:
      console.log(`[stripe-identity-webhook] Unhandled event: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
