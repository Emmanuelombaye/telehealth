/**
 * Patient ↔ assigned doctor messaging (orders.doctor_id).
 */

import { supabase } from "./supabaseClient";

export type AssignedDoctor = {
  id: string;
  name: string;
};

export function patientMessagesHref(doctorId?: string | null): string {
  if (doctorId) return `/patient/messages?userId=${encodeURIComponent(doctorId)}`;
  return "/patient/messages";
}

/** Doctor on the patient's latest order. */
export async function getAssignedDoctor(patientUserId: string): Promise<AssignedDoctor | null> {
  const { data: orders } = await supabase
    .from("orders")
    .select("doctor_id, doctor, created_at")
    .eq("user_id", patientUserId)
    .not("doctor_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const row = orders?.[0];
  if (!row?.doctor_id) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", row.doctor_id)
    .maybeSingle();

  return {
    id: row.doctor_id,
    name: profile?.full_name || row.doctor || "Your doctor",
  };
}
