/**
 * scheduling-webhook — Cal.com / Calendly booking callback.
 *
 * Called by Calendly/Cal.com when a patient books a video consultation.
 * Updates the order with booking details AND inserts a notification
 * so the patient sees it immediately in their portal.
 *
 * POST JSON body (Content-Type: application/json):
 *   Authorization: Bearer <SCHEDULING_WEBHOOK_SECRET>
 *   {
 *     "order_number": "RX-...",
 *     "consultation_time": "2026-05-20T15:00:00-04:00",
 *     "meeting_url": "https://meet.google.com/xxx",
 *     "zoom_status": "confirmed",
 *     "patient_name": "John Doe"    (optional, for notification)
 *   }
 *
 * Env: SCHEDULING_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const SECRET = Deno.env.get("SCHEDULING_WEBHOOK_SECRET") ?? "";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" }
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!SECRET || token !== SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const orderNumber = typeof body.order_number === "string" ? body.order_number.trim() : "";
  if (!orderNumber) {
    return new Response(JSON.stringify({ error: "order_number required" }), { status: 400 });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
  }

  const supabase = createClient(url, key);

  // 1. Build the order patch
  const patch: Record<string, unknown> = {};
  if (typeof body.consultation_time === "string") patch.consultation_time = body.consultation_time;
  if (typeof body.meeting_url === "string" && (body.meeting_url as string).startsWith("https://")) {
    patch.zoom_join_url = body.meeting_url;
  }
  if (typeof body.zoom_status === "string") patch.zoom_status = body.zoom_status;
  else patch.zoom_status = "confirmed"; // default: booking confirmed

  if (Object.keys(patch).length === 0) {
    return new Response(JSON.stringify({ error: "No updatable fields" }), { status: 400 });
  }

  // 2. Update the order
  const { data: order, error } = await supabase
    .from("orders")
    .update(patch)
    .eq("order_number", orderNumber)
    .select("order_number, user_id, patient_name, patient_email, consultation_time, zoom_join_url")
    .maybeSingle();

  if (error) {
    console.error("scheduling-webhook update error", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!order) {
    return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
  }

  // 3. Insert a patient notification
  if (order.user_id) {
    const bookedTime = order.consultation_time
      ? new Date(order.consultation_time).toLocaleString("en-US", {
          weekday: "short", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit", timeZoneName: "short",
        })
      : "your scheduled time";

    await supabase.from("notifications").insert([{
      user_id: order.user_id,
      type: "appointment",
      title: "Video Consultation Confirmed",
      body: `Your video consultation has been booked for ${bookedTime}.${order.zoom_join_url ? ` Join: ${order.zoom_join_url}` : " Check your email for the meeting link."}`,
      unread: true,
    }]);
  }

  // 4. Optional transactional email (booking confirmed)
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const to = typeof order.patient_email === "string" ? order.patient_email : "";
  const meet = (order.zoom_join_url as string) || "";
  if (resendKey && to.includes("@") && meet.startsWith("http")) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Peak Health <hello@peakhealth.com>",
        to: [to],
        subject: "Your video visit is booked",
        html: `<p>Hi ${order.patient_name || "Patient"},</p><p>Your consultation is confirmed.</p><p><a href="${meet}">Join your visit</a></p>`,
      }),
    });
  }

  return new Response(JSON.stringify({ ok: true, order_number: order.order_number }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
