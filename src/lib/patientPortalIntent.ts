/**
 * Session flag for “land on patient portal after enrollment” — no auth-store import
 * (keeps auth-store ↔ enrollment modules from circular-init TDZ errors).
 */
export const FORCE_PATIENT_PORTAL_KEY = "peak_health_force_patient_portal";

export function setForcePatientPortalIntent(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(FORCE_PATIENT_PORTAL_KEY, "1");
  localStorage.removeItem("peak_health_dev_role");
}

export function hasForcePatientPortalIntent(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(FORCE_PATIENT_PORTAL_KEY) === "1";
}

export function clearForcePatientPortalIntent(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(FORCE_PATIENT_PORTAL_KEY);
}
