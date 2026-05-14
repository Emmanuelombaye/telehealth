/**
 * merge-scheduling-pending — After enrollment order insert, attach Calendly booking
 * that arrived early (stored in scheduling_pending_bookings).
 *
 * POST JSON + Authorization: Bearer <user JWT>
 * { "order_number": "RX-...", "scheduling_ref": "SC-..." }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !anon || !service) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const auth = req.headers.get("Authorization") ?? "";
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const uid = userData.user.id;

  let body: { order_number?: string; scheduling_ref?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const orderNumber = typeof body.order_number === "string" ? body.order_number.trim() : "";
  const schedulingRef = typeof body.scheduling_ref === "string" ? body.scheduling_ref.trim() : "";
  if (!orderNumber || !schedulingRef) {
    return new Response(JSON.stringify({ error: "order_number and scheduling_ref required" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(url, service);

  const { data: order, error: oErr } = await admin
    .from("orders")
    .select("id, user_id, order_number, scheduling_ref")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (oErr || !order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  if (order.user_id !== uid) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const { data: pending, error: pErr } = await admin
    .from("scheduling_pending_bookings")
    .select("*")
    .eq("scheduling_ref", schedulingRef)
    .is("consumed_at", null)
    .maybeSingle();

  if (pErr || !pending?.meeting_url) {
    return new Response(JSON.stringify({ merged: false, reason: "no_pending_booking" }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const emailMatch =
    (pending.patient_email as string).toLowerCase().trim() ===
    (userData.user.email ?? "").toLowerCase().trim();
  if (!emailMatch) {
    return new Response(JSON.stringify({ error: "Email mismatch for scheduling ref" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const patch: Record<string, unknown> = {
    zoom_join_url: pending.meeting_url,
    zoom_status: pending.zoom_status || "confirmed",
  };
  if (pending.consultation_time_iso) {
    patch.consultation_time = new Date(pending.consultation_time_iso as string).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }

  const { error: uErr } = await admin.from("orders").update(patch).eq("id", order.id);
  if (uErr) {
    return new Response(JSON.stringify({ error: uErr.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  await admin
    .from("scheduling_pending_bookings")
    .update({ consumed_at: new Date().toISOString(), order_number: orderNumber })
    .eq("id", pending.id);

  await admin.from("notifications").insert([
    {
      user_id: uid,
      type: "appointment",
      title: "Video visit confirmed",
      body: "Your calendar booking is linked to this order. Open Appointments or your order for the join link.",
      unread: true,
    },
  ]);

  return new Response(JSON.stringify({ merged: true, order_id: order.id }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
