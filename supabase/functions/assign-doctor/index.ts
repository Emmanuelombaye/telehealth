import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-internal-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const internalSecret = Deno.env.get("ORDER_ROUTING_INTERNAL_SECRET") ?? "";

  let body: { order_id?: string; patient_state?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const orderId = typeof body.order_id === "string" ? body.order_id.trim() : "";
  const patientState = typeof body.patient_state === "string" ? body.patient_state.trim() : "";
  if (!orderId || !patientState) {
    return new Response(JSON.stringify({ error: "order_id and patient_state required" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const internalHeader = req.headers.get("X-Internal-Secret") ?? "";

  const admin = createClient(url, serviceKey);

  const { data: order, error: oErr } = await admin
    .from("orders")
    .select("id, user_id, doctor_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (oErr || !order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let authorized = Boolean(internalSecret && internalHeader === internalSecret);
  if (!authorized && authHeader.startsWith("Bearer ")) {
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: ud, error: uErr } = await userClient.auth.getUser();
    if (!uErr && ud.user?.id && order.user_id === ud.user.id) authorized = true;
  }

  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (order.doctor_id) {
    return new Response(JSON.stringify({ success: true, noop: true, reason: "already_assigned" }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (order.status !== "order_submitted") {
    return new Response(
      JSON.stringify({ success: true, noop: true, reason: "status_not_routable", status: order.status }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  try {
    const { data: doctors, error: docError } = await admin
      .from("profiles")
      .select("id, full_name, patients_count, licensed_states, calendly_url")
      .eq("role", "doctor")
      .eq("status", "active")
      .order("patients_count", { ascending: true });

    if (docError) throw docError;

    const pool = doctors || [];
    const st = patientState.toUpperCase();
    const inState = (d: { licensed_states?: string | null }) =>
      (d.licensed_states || "")
        .split(",")
        .map((s: string) => s.trim().toUpperCase())
        .filter(Boolean)
        .includes(st);
    const withCal = (d: { calendly_url?: string | null }) =>
      typeof d.calendly_url === "string" && /^https?:\/\//i.test(d.calendly_url.trim());

    const assignedDoctor =
      pool.find((d) => inState(d) && withCal(d)) ||
      pool.find((d) => inState(d));

    if (!assignedDoctor) {
      console.warn(`[assign-doctor] No licensed doctor for state ${patientState}`);
      return new Response(JSON.stringify({ error: "No eligible doctor found" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { error: updateError } = await admin
      .from("orders")
      .update({
        doctor_id: assignedDoctor.id,
        doctor: assignedDoctor.full_name,
        status: "medical_review",
      })
      .eq("id", orderId);

    if (updateError) throw updateError;

    const { error: rpcErr } = await admin.rpc("increment_patients_count", { doctor_id: assignedDoctor.id });
    if (rpcErr) console.warn("[assign-doctor] increment_patients_count:", rpcErr.message);

    return new Response(
      JSON.stringify({
        success: true,
        doctor_id: assignedDoctor.id,
        doctor_name: assignedDoctor.full_name,
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
