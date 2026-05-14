/**
 * Calendly native webhook — invitee.created
 *
 * 1) Match order by tracking UTM / scheduling_ref on orders, then
 * 2) Match by patient_email on recent open orders, else
 * 3) Store scheduling_pending_bookings for post-enrollment merge.
 *
 * Configure in Calendly: Webhooks → invitee.created → this function URL.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

function deepFindJoinUrl(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  if (typeof o.join_url === "string" && o.join_url.startsWith("http")) return o.join_url;
  if (typeof o.location === "string" && o.location.startsWith("http")) return o.location;
  for (const k of Object.keys(o)) {
    const v = o[k];
    const found = deepFindJoinUrl(v);
    if (found) return found;
  }
  return null;
}

function extractInvite(payloadRoot: Record<string, unknown>): {
  email: string | null;
  name: string | null;
  startTime: string | null;
  joinUrl: string | null;
  utmContent: string | null;
} {
  const p = (payloadRoot.payload as Record<string, unknown>) ?? payloadRoot;
  const invitee = (p.invitee as Record<string, unknown>) ?? p;
  const email =
    (typeof invitee.email === "string" && invitee.email) ||
    (typeof p.email === "string" && p.email) ||
    null;
  const name =
    (typeof invitee.name === "string" && invitee.name) ||
    (typeof p.name === "string" && p.name) ||
    null;

  const ev = (p.event as Record<string, unknown>) ?? (p.scheduled_event as Record<string, unknown>) ?? p;
  const startTime =
    (typeof ev.start_time === "string" && ev.start_time) ||
    (typeof p.start_time === "string" && p.start_time) ||
    null;

  const loc = ev.location ?? p.location;
  let joinUrl = deepFindJoinUrl(loc);
  if (!joinUrl) joinUrl = deepFindJoinUrl(ev) ?? deepFindJoinUrl(p);

  const tracking = (p.tracking as Record<string, unknown>) ??
    (invitee.tracking as Record<string, unknown>) ?? {};
  const utmContent =
    (typeof tracking.utm_content === "string" && tracking.utm_content.trim()) ||
    (typeof tracking.utm_campaign === "string" && tracking.utm_campaign.trim()) ||
    null;

  return { email, name, startTime, joinUrl, utmContent };
}

serve(async (req: Request) => {
  try {
    const payloadRoot = (await req.json()) as Record<string, unknown>;
    const event = payloadRoot.event as string | undefined;
    if (event !== "invitee.created") {
      return new Response("Event ignored", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, name, startTime, joinUrl, utmContent } = extractInvite(payloadRoot);
    if (!email) {
      return new Response(JSON.stringify({ error: "No invitee email" }), { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── A) Match by scheduling_ref on an existing order ─────────────────────
    if (utmContent && utmContent.startsWith("SC-")) {
      const { data: byRef } = await supabase
        .from("orders")
        .select("id, user_id, order_number")
        .eq("scheduling_ref", utmContent)
        .eq("patient_email", normalizedEmail)
        .is("zoom_join_url", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (byRef?.id && joinUrl) {
        await supabase
          .from("orders")
          .update({
            zoom_status: "confirmed",
            zoom_join_url: joinUrl,
            consultation_time: startTime
              ? new Date(startTime).toLocaleString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZoneName: "short",
                })
              : null,
          })
          .eq("id", byRef.id);

        if (byRef.user_id) {
          await supabase.from("notifications").insert([
            {
              user_id: byRef.user_id,
              type: "appointment",
              title: "Video consult confirmed",
              body: "Your booking is saved on your order. Use the join link at visit time.",
              unread: true,
            },
          ]);
        }
        return new Response(JSON.stringify({ success: true, match: "scheduling_ref" }), { status: 200 });
      }
    }

    // ── B) Latest order for this email (legacy) ───────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, order_number, zoom_join_url, created_at")
      .eq("patient_email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(5);

    const open = (order || []).find(
      (o) =>
        o.zoom_join_url == null &&
        new Date((o as { created_at?: string }).created_at ?? 0).getTime() >
          Date.now() - 14 * 24 * 60 * 60 * 1000
    );

    if (!orderError && open && joinUrl) {
      await supabase
        .from("orders")
        .update({
          zoom_status: "confirmed",
          zoom_join_url: joinUrl,
          consultation_time: startTime
            ? new Date(startTime).toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZoneName: "short",
              })
            : null,
        })
        .eq("id", open.id);

      if (open.user_id) {
        await supabase.from("notifications").insert([
          {
            user_id: open.user_id,
            type: "appointment",
            title: "Video consult confirmed",
            body: "Your video call has been scheduled. Check Appointments or your order for the join link.",
            unread: true,
          },
        ]);
      }
      return new Response(JSON.stringify({ success: true, match: "patient_email" }), { status: 200 });
    }

    // ── C) Pending row for pre-submit Calendly bookings ──────────────────────
    if (utmContent && utmContent.startsWith("SC-") && joinUrl) {
      await supabase.from("scheduling_pending_bookings").delete().eq("scheduling_ref", utmContent).is("consumed_at", null);

      const { error: insErr } = await supabase.from("scheduling_pending_bookings").insert([
        {
          scheduling_ref: utmContent,
          patient_email: normalizedEmail,
          invitee_name: name,
          meeting_url: joinUrl,
          consultation_time_iso: startTime ? new Date(startTime).toISOString() : null,
          zoom_status: "confirmed",
          provider: "calendly",
          raw_payload: payloadRoot as unknown as Record<string, unknown>,
        },
      ]);
      if (insErr?.code === "42P01") {
        console.warn("scheduling_pending_bookings missing — run supabase_scheduling_correlation.sql");
        return new Response(JSON.stringify({ error: "pending_table_missing" }), { status: 503 });
      }
      if (insErr) throw insErr;
      return new Response(JSON.stringify({ success: true, match: "pending_booking" }), { status: 200 });
    }

    console.warn(`Calendly: no order/pending match for ${normalizedEmail}`);
    return new Response(JSON.stringify({ ok: true, note: "no_matching_order" }), { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Calendly Webhook Error: ${msg}`);
    return new Response(msg, { status: 500 });
  }
});
