import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/**
 * Truepill / Curexa Fulfillment Webhook
 * 
 * This Supabase Edge Function is triggered automatically via a Database Webhook 
 * whenever an `orders` row updates its `status` to `rx_sent`.
 * 
 * It calls the Pharmacy API to fulfill the order, and then updates the Supabase 
 * database with the tracking number.
 */

serve(async (req) => {
  try {
    // 1. Verify Webhook Secret (Security)
    const webhookSecret = Deno.env.get("TRUEPILL_WEBHOOK_SECRET");
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Parse the Database Payload
    const payload = await req.json();
    const record = payload.record; // The updated row in the orders table
    
    // Only proceed if the status actually changed to rx_sent
    if (payload.type !== "UPDATE" || record.status !== "rx_sent") {
      return new Response("Ignored - Status is not rx_sent", { status: 200 });
    }

    console.log(`Processing Pharmacy Fulfillment for Order: ${record.order_number}`);

    // 3. Call the Truepill / Curexa API
    const pharmacyApiKey = Deno.env.get("PHARMACY_API_KEY");
    const pharmacyResponse = await fetch("https://api.truepill.com/v1/fulfillment/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${pharmacyApiKey}`
      },
      body: JSON.stringify({
        external_id: record.order_number,
        patient: {
          first_name: record.patient_name.split(' ')[0],
          last_name: record.patient_name.split(' ').slice(1).join(' '),
          // other patient details...
        },
        items: [
          {
            medication: record.medication,
            directions: record.dosage_instructions,
            quantity: 1
          }
        ],
        shipping_method: record.urgent ? "overnight" : "ground"
      })
    });

    if (!pharmacyResponse.ok) {
      throw new Error(`Pharmacy API failed: ${await pharmacyResponse.text()}`);
    }

    const pharmacyData = await pharmacyResponse.json();
    console.log(`Pharmacy accepted order. Tracking: ${pharmacyData.tracking_number}`);

    // 4. Connect back to Supabase to update the order with the Tracking Number
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        status: 'shipped',
        tracking: pharmacyData.tracking_number,
        carrier: pharmacyData.carrier,
        tracking_url: pharmacyData.tracking_url
      })
      .eq('id', record.id);

    if (updateError) {
      throw new Error(`Failed to update Supabase: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
