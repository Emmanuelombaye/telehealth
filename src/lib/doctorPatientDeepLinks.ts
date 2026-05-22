/**
 * Deep links from Patient Management cards → Vitals / RPM / Documents for one patient.
 * Query keys align with roster `key` (user_id || patient_name).
 */

import type { DoctorPatientRecord } from "./doctorPatientManagement";

export function patientChartKey(p: Pick<DoctorPatientRecord, "userId" | "name">): string {
  return p.userId || p.name;
}

export function patientVitalsHref(
  base: "/doctor" | "/providers",
  p: Pick<DoctorPatientRecord, "userId" | "name">,
): string {
  return `${base}/vitals?patient=${encodeURIComponent(patientChartKey(p))}`;
}

export function patientRpmHref(
  base: "/doctor" | "/providers",
  p: Pick<DoctorPatientRecord, "userId" | "name">,
): string {
  return `${base}/rpm?patient=${encodeURIComponent(patientChartKey(p))}`;
}

export function patientDocumentsHref(
  base: "/doctor" | "/providers",
  p: Pick<DoctorPatientRecord, "userId" | "name">,
): string {
  if (p.userId) {
    return `${base}/documents?patientId=${encodeURIComponent(p.userId)}`;
  }
  return `${base}/documents?patientName=${encodeURIComponent(p.name)}`;
}
