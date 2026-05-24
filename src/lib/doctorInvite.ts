/**
 * Super Admin doctor provisioning — calls invite-doctor edge function.
 */

import { supabase } from "./supabaseClient";

export type InviteDoctorPayload = {
  email: string;
  full_name: string;
  specialty?: string | null;
  npi_number?: string | null;
  credentials?: string | null;
  licensed_states: string;
  calendly_url?: string | null;
};

export type InviteDoctorResult = {
  success: boolean;
  doctor_id: string;
  email: string;
  temp_password?: string;
  already_existed?: boolean;
};

/** Comma-separated US state codes, e.g. "TX, CA, NY" */
export function normalizeLicensedStates(raw: string): string {
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{2}$/.test(s))
    .join(",");
}

export function validateLicensedStates(raw: string): string | null {
  const normalized = normalizeLicensedStates(raw);
  if (!normalized) return "Enter at least one US state code (e.g. TX, CA, NY).";
  return null;
}

export async function inviteDoctor(payload: InviteDoctorPayload): Promise<InviteDoctorResult> {
  const licensed_states = normalizeLicensedStates(payload.licensed_states);
  const statesErr = validateLicensedStates(licensed_states);
  if (statesErr) throw new Error(statesErr);

  const cal = payload.calendly_url?.trim() || null;
  if (cal && !/^https?:\/\//i.test(cal)) {
    throw new Error("Calendar URL must start with http:// or https://");
  }

  const { data, error } = await supabase.functions.invoke("invite-doctor", {
    body: {
      email: payload.email.trim().toLowerCase(),
      full_name: payload.full_name.trim(),
      specialty: payload.specialty?.trim() || null,
      npi_number: payload.npi_number?.trim() || null,
      credentials: payload.credentials?.trim() || null,
      licensed_states,
      calendly_url: cal,
    },
  });

  if (error) {
    throw new Error(error.message || "Could not provision doctor account.");
  }

  const result = data as InviteDoctorResult & { error?: string };
  if (result?.error) throw new Error(result.error);
  if (!result?.success) throw new Error("Doctor provisioning failed.");

  return result;
}

export type DoctorProfileUpdate = {
  full_name?: string;
  specialty?: string | null;
  npi_number?: string | null;
  credentials?: string | null;
  licensed_states?: string;
  calendly_url?: string | null;
  status?: "active" | "revoked";
};

export async function updateDoctorProfile(doctorId: string, patch: DoctorProfileUpdate) {
  const body: Record<string, unknown> = { ...patch };
  if (patch.licensed_states !== undefined) {
    const normalized = normalizeLicensedStates(patch.licensed_states);
    const err = validateLicensedStates(normalized);
    if (err) throw new Error(err);
    body.licensed_states = normalized;
  }
  if (patch.calendly_url !== undefined) {
    const url = patch.calendly_url?.trim() || null;
    if (url && !/^https?:\/\//i.test(url)) throw new Error("Calendar URL must start with http:// or https://");
    body.calendly_url = url;
  }

  const { error } = await supabase.from("profiles").update(body).eq("id", doctorId).eq("role", "doctor");
  if (error) throw error;
}
