/**
 * Physician settings & profile — load/save profiles + auth metadata.
 */

import { supabase } from "./supabaseClient";
import type { User } from "@supabase/supabase-js";

export type DoctorNotificationPrefs = {
  queueAlerts: boolean;
  labResults: boolean;
  messages: boolean;
  videoVisits: boolean;
  rpmVitals: boolean;
  emailDigest: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: DoctorNotificationPrefs = {
  queueAlerts: true,
  labResults: true,
  messages: true,
  videoVisits: true,
  rpmVitals: true,
  emailDigest: false,
};

export type DoctorProfileForm = {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  language: string;
  timezone: string;
  npiNumber: string;
  specialty: string;
  credentials: string;
  licensedStates: string;
  calendlyUrl: string;
  avatarUrl: string;
  status: string;
  notificationPrefs: DoctorNotificationPrefs;
};

export type DoctorScheduleSnapshot = {
  timezone: string;
  bufferMins: number;
  consultVideo: boolean;
  consultAsync: boolean;
};

export function parseNameParts(fullName: string, user: User | null): { firstName: string; lastName: string } {
  const meta = user?.user_metadata || {};
  if (meta.first_name) {
    return {
      firstName: String(meta.first_name),
      lastName: String(meta.last_name || ""),
    };
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function profileInitials(name: string): string {
  return (name || "DR")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function mergeDoctorProfile(user: User, row: Record<string, unknown> | null): DoctorProfileForm {
  const meta = user.user_metadata || {};
  const prefsRaw = meta.doctor_notification_prefs as Partial<DoctorNotificationPrefs> | undefined;
  const fullName =
    (row?.full_name as string) ||
    (meta.full_name as string) ||
    `${meta.first_name || ""} ${meta.last_name || ""}`.trim() ||
    "Physician";
  const { firstName, lastName } = parseNameParts(fullName, user);

  return {
    fullName,
    firstName,
    lastName,
    email: (row?.email as string) || user.email || "",
    phone: (row?.phone as string) || (meta.phone as string) || "",
    address: (row?.address as string) || (meta.address as string) || "",
    dateOfBirth: (row?.date_of_birth as string) || (meta.date_of_birth as string) || "",
    language: (row?.language as string) || (meta.language as string) || "English",
    timezone: (meta.timezone as string) || "America/New_York",
    npiNumber: (row?.npi_number as string) || "",
    specialty: (row?.specialty as string) || (meta.specialty as string) || "",
    credentials: (row?.credentials as string) || "",
    licensedStates: (row?.licensed_states as string) || "",
    calendlyUrl: (row?.calendly_url as string) || "",
    avatarUrl: (row?.avatar_url as string) || "",
    status: (row?.status as string) || "active",
    notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS, ...prefsRaw },
  };
}

export async function fetchDoctorProfile(userId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return (data as Record<string, unknown>) || null;
}

export async function fetchDoctorSchedule(userId: string): Promise<DoctorScheduleSnapshot | null> {
  const { data, error } = await supabase
    .from("doctor_schedules")
    .select("timezone, buffer_mins, schedule")
    .eq("doctor_id", userId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") return null;
  if (!data) return null;
  const sched = data.schedule as { consult_types?: { video?: boolean; async?: boolean } } | null;
  const consult = sched?.consult_types;
  return {
    timezone: data.timezone || "America/New_York",
    bufferMins: data.buffer_mins ?? 10,
    consultVideo: consult?.video !== false,
    consultAsync: consult?.async !== false,
  };
}

/** Strip columns PostgREST reports missing (PGRST204) and retry upsert. */
async function upsertProfileRow(row: Record<string, unknown>): Promise<void> {
  let payload = { ...row };
  for (let attempt = 0; attempt < 12; attempt++) {
    const { error } = await supabase.from("profiles").upsert(payload);
    if (!error) return;
    const missing =
      error.code === "PGRST204" &&
      typeof error.message === "string" &&
      /Could not find the '(\w+)' column/.exec(error.message);
    if (missing?.[1] && missing[1] in payload) {
      delete payload[missing[1]];
      continue;
    }
    throw error;
  }
}

export async function saveDoctorProfile(user: User, form: DoctorProfileForm): Promise<void> {
  const fullName =
    form.fullName.trim() ||
    `${form.firstName.trim()} ${form.lastName.trim()}`.trim() ||
    "Physician";

  const row: Record<string, unknown> = {
    id: user.id,
    full_name: fullName,
    email: form.email || user.email,
    phone: form.phone || null,
    address: form.address || null,
    date_of_birth: form.dateOfBirth || null,
    language: form.language || null,
    updated_at: new Date().toISOString(),
    npi_number: form.npiNumber || null,
    specialty: form.specialty || null,
    credentials: form.credentials || null,
    licensed_states: form.licensedStates || null,
    calendly_url: form.calendlyUrl || null,
    avatar_url: form.avatarUrl || null,
  };

  await upsertProfileRow(row);

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      first_name: form.firstName,
      last_name: form.lastName,
      full_name: fullName,
      phone: form.phone,
      address: form.address,
      date_of_birth: form.dateOfBirth,
      language: form.language,
      specialty: form.specialty,
      timezone: form.timezone,
      doctor_notification_prefs: form.notificationPrefs,
    },
  });
  if (authError) throw authError;
}

export async function saveDoctorSchedulePrefs(
  userId: string,
  form: DoctorProfileForm,
  scheduleSnap: DoctorScheduleSnapshot | null,
): Promise<void> {
  if (!scheduleSnap) return;
  await supabase.from("doctor_schedules").upsert({
    doctor_id: userId,
    timezone: form.timezone,
    buffer_mins: scheduleSnap.bufferMins,
    updated_at: new Date().toISOString(),
  });
}

export async function updateDoctorPassword(newPassword: string): Promise<void> {
  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export const US_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "Portuguese", "Mandarin", "Arabic"];
