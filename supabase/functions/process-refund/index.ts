import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@12.4.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer",
};

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // --------------- 1. Authenticate Request & Enforce Strict Roles ---------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Access Denied: Missing authentication credentials" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize user-scoped client
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Session Expired: Re-authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Retrieve verified account role from Database profiles
    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const allowedRoles = ["super_admin", "brand_admin", "doctor"];
    if (profileError || !profile || !allowedRoles.includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Forbidden: You do not have elevated privileges to authorize refunds" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --------------- 2. Execute Financial Transaction ---------------
    const { order_id, payment_intent_id } = await req.json();

    if (!payment_intent_id) {
      return new Response(JSON.stringify({ error: "Missing required parameter: payment_intent_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log(`[Financial Audit] Authorized refund initiated by ${user.email} for PI: ${payment_intent_id}`);
    
    // Execute Stripe Refund
    const refund = await stripe.refunds.create({
      payment_intent: payment_intent_id,
      reason: 'requested_by_customer',
      metadata: { order_id, authorized_by: user.email }
    });

    // Update Database Order
    const { error: updateError } = await serviceClient
      .from('orders')
      .update({ 
        payment_status: 'refunded',
        refund_id: refund.id,
        timeline: serviceClient.rpc('append_timeline_event', { 
          status: 'refunded', 
          message: `Refund processed securely by ${user.email}. Reference: ${refund.id}` 
        })
      })
      .eq('id', order_id);

    if (updateError) throw updateError;

    // Secure audit log write
    await serviceClient.from('admin_audit_logs').insert([{
      actor_email: user.email,
      role: profile.role,
      brand_scope: 'Global',
      action: `Financial Refund: PI #${payment_intent_id}`,
      target_type: "Payment Gateways",
      target_id: order_id,
      detail: { refund_id: refund.id, amount: refund.amount }
    }]);

    return new Response(JSON.stringify({ success: true, refund_id: refund.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error(`[Security Alert] Refund processing failed: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
