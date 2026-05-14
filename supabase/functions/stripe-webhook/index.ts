import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@12.4.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature || !endpointSecret) {
    return new Response("Webhook secret or signature missing.", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata || {};
        if (meta.order_id) {
          await supabaseClient
            .from("orders")
            .update({ payment_status: "paid" })
            .eq("id", meta.order_id);
        }
        if (meta.order_number) {
          await supabaseClient
            .from("orders")
            .update({ payment_status: "paid" })
            .eq("order_number", meta.order_number);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const meta = pi.metadata || {};
        await supabaseClient
          .from("orders")
          .update({ payment_status: "paid" })
          .eq("stripe_payment_intent_id", pi.id);
        if (meta.order_number) {
          await supabaseClient
            .from("orders")
            .update({ payment_status: "paid", stripe_payment_intent_id: pi.id })
            .eq("order_number", meta.order_number);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const meta = pi.metadata || {};
        await supabaseClient
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("stripe_payment_intent_id", pi.id);
        if (meta.order_number) {
          await supabaseClient
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("order_number", meta.order_number);
        }
        break;
      }
      // Add other Stripe events as needed
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
