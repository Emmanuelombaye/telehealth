/**
 * zoom-video-token — Supabase Edge Function
 *
 * Generates a signed Zoom Video SDK JWT for a given session (room).
 * Called by the patient consult page just before joining.
 *
 * Required secrets (set in Supabase Dashboard → Edge Functions → Secrets):
 *   ZOOM_VIDEO_SDK_KEY     — SDK Key from Zoom Marketplace app (Video SDK type)
 *   ZOOM_VIDEO_SDK_SECRET  — SDK Secret from the same app
 *
 * POST body: { sessionName: string, role: 0 | 1, userIdentity?: string }
 *   role 0 = attendee (patient)
 *   role 1 = host (doctor)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// ── Minimal HMAC-SHA256 JWT implementation (no external deps) ────────────────
async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  const keyBytes = new TextEncoder().encode(secret);
  const msgBytes = new TextEncoder().encode(signingInput);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgBytes);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { sessionName, role = 0, userIdentity = "patient" } = await req.json();

    if (!sessionName) {
      return new Response(
        JSON.stringify({ error: "sessionName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sdkKey = Deno.env.get("ZOOM_VIDEO_SDK_KEY");
    const sdkSecret = Deno.env.get("ZOOM_VIDEO_SDK_SECRET");

    if (!sdkKey || !sdkSecret) {
      return new Response(
        JSON.stringify({ error: "Zoom Video SDK credentials not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60 * 2; // 2-hour session token

    const payload = {
      app_key: sdkKey,
      tpc: sessionName,       // topic = session/room name
      role_type: role,        // 0 = attendee, 1 = host
      user_identity: userIdentity,
      version: 1,
      iat,
      exp,
    };

    const token = await signJwt(payload, sdkSecret);

    return new Response(
      JSON.stringify({ token, sdkKey, sessionName }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("zoom-video-token error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
