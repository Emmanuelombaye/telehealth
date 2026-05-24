/**
 * invite-doctor — Super Admin provisions a clinician: Auth user + profile + invitation record.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeLicensedStates(raw: string): string {
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{2}$/.test(s))
    .join(",");
}

function tempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  for (let i = 0; i < 16; i++) out += chars[bytes[i] % chars.length];
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user: caller },
      error: callerErr,
    } = await userClient.auth.getUser();
    if (callerErr || !caller) return json({ error: "Unauthorized" }, 401);

    const { data: callerProfile } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "super_admin") {
      return json({ error: "Forbidden: super admin only" }, 403);
    }

    const body = await req.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const full_name = String(body.full_name || "").trim();
    const licensed_states = normalizeLicensedStates(String(body.licensed_states || ""));

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return json({ error: "Valid email is required" }, 400);
    }
    if (!full_name) return json({ error: "Full name is required" }, 400);
    if (!licensed_states) {
      return json({ error: "At least one licensed state is required (e.g. TX, CA)" }, 400);
    }

    const calendly_url = body.calendly_url ? String(body.calendly_url).trim() : null;
    if (calendly_url && !/^https?:\/\//i.test(calendly_url)) {
      return json({ error: "Calendar URL must start with http:// or https://" }, 400);
    }

    const specialty = body.specialty ? String(body.specialty).trim() : null;
    const npi_number = body.npi_number ? String(body.npi_number).trim() : null;
    const credentials = body.credentials ? String(body.credentials).trim() : null;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, role")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile?.role && existingProfile.role !== "doctor") {
      return json({ error: `Email already used by a ${existingProfile.role} account` }, 409);
    }

    let doctorId: string;
    let temp_password: string | undefined;
    let already_existed = false;

    if (existingProfile?.id) {
      already_existed = true;
      doctorId = existingProfile.id;

      await admin.auth.admin.updateUserById(doctorId, {
        user_metadata: { role: "doctor", full_name },
        app_metadata: { role: "doctor" },
      });
    } else {
      temp_password = tempPassword();
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: temp_password,
        email_confirm: true,
        user_metadata: { role: "doctor", full_name },
        app_metadata: { role: "doctor" },
      });
      if (createErr) throw createErr;
      doctorId = created.user.id;
    }

    const profileRow = {
      id: doctorId,
      email,
      full_name,
      role: "doctor",
      status: "active",
      specialty,
      npi_number,
      credentials,
      licensed_states,
      calendly_url,
      patients_count: 0,
    };

    const { error: profileErr } = await admin.from("profiles").upsert(profileRow, { onConflict: "id" });
    if (profileErr) throw profileErr;

    const invitationPayload = {
      email,
      full_name,
      specialty,
      npi_number,
      credentials,
      licensed_states,
      calendly_url,
      status: "accepted",
      accepted_at: new Date().toISOString(),
      invited_by: caller.id,
    };

    const { data: existingInvite } = await admin
      .from("doctor_invitations")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingInvite?.id) {
      await admin.from("doctor_invitations").update(invitationPayload).eq("id", existingInvite.id);
    } else {
      await admin.from("doctor_invitations").insert(invitationPayload);
    }

    return json({
      success: true,
      doctor_id: doctorId,
      email,
      temp_password: already_existed ? undefined : temp_password,
      already_existed,
    });
  } catch (err) {
    console.error("invite-doctor error:", err);
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
