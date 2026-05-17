/**
 * verify-identity — Supabase Edge Function
 *
 * Creates a Stripe Identity VerificationSession and returns the client_secret
 * so the frontend can launch the Stripe Identity modal.
 *
 * POST body: { userId: string, orderId: string }
 * Returns: { clientSecret: string, sessionId: string }
 *
 * Env secrets needed:
 *   STRIPE_SECRET_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

serve(async (req: Request) => {
  // Always handle preflight first — before any other logic
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[verify-identity] STRIPE_SECRET_KEY is not set.");
      return jsonResponse({ error: "Identity verification is not configured. Please contact support." }, 503);
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body = await req.json().catch(() => ({}));
    const { userId, orderId } = body as { userId?: string; orderId?: string };

    // Create a Stripe Identity VerificationSession
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        user_id: userId ?? "",
        order_id: orderId ?? "",
        source: "peak_health_kyc",
      },
      options: {
        document: {
          allowed_types: ["driving_license", "passport", "id_card"],
          require_id_number: false,
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
    });

    // Mark order kyc_status as 'pending' if an orderId was supplied
    if (orderId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      await supabase
        .from("orders")
        .update({
          kyc_status: "pending",
          kyc_session_id: verificationSession.id,
        })
        .eq("order_number", orderId);
    }

    return jsonResponse({
      clientSecret: verificationSession.client_secret,
      sessionId: verificationSession.id,
    });

  } catch (err: any) {
    console.error("[verify-identity] Error:", err.message);
    return jsonResponse({ error: err.message ?? "Internal error" }, 500);
  }
});
