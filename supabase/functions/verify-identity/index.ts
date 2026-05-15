/**
 * verify-identity — Supabase Edge Function
 *
 * Creates a Stripe Identity VerificationSession and returns the client_secret
 * so the frontend can launch the Stripe Identity modal.
 *
 * POST body: { userId: string, orderId: string }
 *
 * Returns: { clientSecret: string, sessionId: string }
 *
 * Env secrets needed:
 *   STRIPE_SECRET_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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

  try {
    const { userId, orderId } = await req.json();

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
          // Accept driver's license, passport, and ID card
          allowed_types: ["driving_license", "passport", "id_card"],
          require_id_number: false,
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
    });

    // Update kyc_status to 'pending' (session created) on the order
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

    return new Response(
      JSON.stringify({
        clientSecret: verificationSession.client_secret,
        sessionId: verificationSession.id,
      }),
      { status: 200, headers: CORS }
    );
  } catch (err: any) {
    console.error("[verify-identity] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
});
