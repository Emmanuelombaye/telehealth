import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@12.4.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  try {
    const { order_id, payment_intent_id } = await req.json();

    if (!payment_intent_id) {
      return new Response(JSON.stringify({ error: "No payment intent ID found for refund" }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Execute Stripe Refund
    console.log(`Initiating refund for PI: ${payment_intent_id}`);
    const refund = await stripe.refunds.create({
      payment_intent: payment_intent_id,
      reason: 'requested_by_customer', // Best fit for medical disqualification
      metadata: { order_id }
    });

    // 2. Update Order with refund details
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'refunded',
        refund_id: refund.id,
        timeline: supabase.rpc('append_timeline_event', { 
          status: 'refunded', 
          message: `Stripe refund processed: ${refund.id}` 
        })
      })
      .eq('id', order_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, refund_id: refund.id }), { status: 200 });

  } catch (err) {
    console.error(`Refund error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
