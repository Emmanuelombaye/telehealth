/**
 * verify-otp — Supabase Edge Function
 *
 * Verifies a Twilio Verify OTP token entered by the patient.
 *
 * POST body: { phone: "+15551234567", code: "123456" }
 *
 * Returns: { verified: true/false }
 *
 * Env secrets needed:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_VERIFY_SERVICE_SID
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
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: "phone and code required" }), { status: 400, headers: CORS });
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken  = Deno.env.get("TWILIO_AUTH_TOKEN");
    const serviceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!accountSid || !authToken || !serviceSid) {
      throw new Error("Twilio credentials not configured in Edge Function secrets.");
    }

    const credentials = btoa(`${accountSid}:${authToken}`);
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationChecks`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, Code: code }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ verified: false, error: data.message }),
        { status: 400, headers: CORS }
      );
    }

    const verified = data.status === "approved";
    return new Response(JSON.stringify({ verified, status: data.status }), { status: 200, headers: CORS });
  } catch (err: any) {
    console.error("[verify-otp] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
});
