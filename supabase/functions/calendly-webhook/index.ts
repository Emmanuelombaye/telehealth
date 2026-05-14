import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  try {
    const payload = await req.json();
    const event = payload.event;
    const data = payload.payload;

    // We only care about new bookings
    if (event !== 'invitee.created') {
      return new Response("Event ignored", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const inviteeEmail = data.email;
    const meetingUrl = data.scheduled_event?.location?.join_url || data.scheduled_event?.location?.location;
    const startTime = data.scheduled_event?.start_time;

    console.log(`Processing Calendly booking for ${inviteeEmail}`);

    // 1. Find the most recent active order for this email
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, order_number')
      .eq('patient_email', inviteeEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (orderError || !order) {
      console.warn(`No order found for email ${inviteeEmail}`);
      return new Response("Order not found", { status: 404 });
    }

    // 2. Update order with meeting details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        zoom_status: 'confirmed',
        zoom_join_url: meetingUrl,
        consultation_time: new Date(startTime).toLocaleString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
        })
      })
      .eq('id', order.id);

    if (updateError) throw updateError;

    // 3. Send confirmation notification to patient
    await supabase.from('notifications').insert([{
      user_id: order.user_id,
      type: 'appointment',
      title: 'Video Consult Confirmed',
      body: `Your video call has been scheduled. You can join directly from the Appointments tab at the scheduled time.`,
      unread: true
    }]);

    return new Response(JSON.stringify({ success: true, order_id: order.id }), { status: 200 });

  } catch (err) {
    console.error(`Calendly Webhook Error: ${err.message}`);
    return new Response(err.message, { status: 500 });
  }
});
