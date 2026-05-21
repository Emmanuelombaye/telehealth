/**
 * Pick a licensed clinician with a booking calendar for enrollment Path A (Calendly / Cal.com).
 */

export type SchedulingDoctorRow = {
  id: string;
  full_name: string | null;
  calendly_url?: string | null;
  licensed_states?: string | null;
  patients_count?: number | null;
};

function licensedStatesList(raw: string | null | undefined): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{2}$/.test(s));
}

function isLicensedInState(doc: SchedulingDoctorRow, patientState: string): boolean {
  const st = patientState.trim().toUpperCase();
  if (!st || !/^[A-Z]{2}$/.test(st)) return true;
  const states = licensedStatesList(doc.licensed_states);
  if (!states.length) return true;
  return states.includes(st);
}

function hasBookingUrl(doc: SchedulingDoctorRow): boolean {
  const u = (doc.calendly_url || "").trim();
  return u.startsWith("http://") || u.startsWith("https://");
}

/**
 * Prefer: licensed in patient state + has Calendly/Cal URL; lowest patient load as tie-break.
 */
export function pickEligibleSchedulingDoctor(
  doctors: SchedulingDoctorRow[],
  patientState: string,
): SchedulingDoctorRow | null {
  const eligible = doctors.filter((d) => isLicensedInState(d, patientState));
  if (!eligible.length) return null;

  const withCalendar = eligible.filter(hasBookingUrl);
  const pool = withCalendar.length ? withCalendar : eligible;

  return [...pool].sort((a, b) => {
    const loadA = a.patients_count ?? 0;
    const loadB = b.patients_count ?? 0;
    if (loadA !== loadB) return loadA - loadB;
    if (hasBookingUrl(a) !== hasBookingUrl(b)) return hasBookingUrl(b) ? 1 : -1;
    return (a.full_name || "").localeCompare(b.full_name || "");
  })[0];
}
