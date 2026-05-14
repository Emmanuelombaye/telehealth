/**
 * send-otp — Supabase Edge Function
 *
 * Sends a real OTP via Twilio Verify to the patient's phone number.
 *
 * POST body: { phone: "+15551234567" }
 *
 * Env secrets needed:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_VERIFY_SERVICE_SID   (create at console.twilio.com/verify/services)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { phone } = await req.json();
    if (!phone) {
      return new Response(JSON.stringify({ error: "phone required" }), { status: 400, headers: CORS });
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken  = Deno.env.get("TWILIO_AUTH_TOKEN");
    const serviceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!accountSid || !authToken || !serviceSid) {
      throw new Error("Twilio credentials not configured in Edge Function secrets.");
    }

    const credentials = btoa(`${accountSid}:${authToken}`);
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, Channel: "sms" }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.error("[send-otp] Twilio error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to send OTP" }),
        { status: 400, headers: CORS }
      );
    }

    return new Response(JSON.stringify({ status: data.status }), { status: 200, headers: CORS });
  } catch (err: any) {
    console.error("[send-otp] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
});
