import { useLocation } from "react-router";

/** Canonical provider portal URL prefix (also mirrors `/providers`). */
export function doctorPortalBaseFromPath(pathname: string): "/doctor" | "/providers" {
  return pathname.startsWith("/providers") ? "/providers" : "/doctor";
}

export function useDoctorPortalBase(): "/doctor" | "/providers" {
  const { pathname } = useLocation();
  return doctorPortalBaseFromPath(pathname);
}

/** Production path: https://www.peak-health.io/doctor/messages */
export const DOCTOR_MESSAGES_CANONICAL = "/doctor/messages";

export function doctorMessagesHref(
  base: "/doctor" | "/providers",
  patientUserId?: string | null,
): string {
  const path = `${base}/messages`;
  if (patientUserId) {
    return `${path}?userId=${encodeURIComponent(patientUserId)}`;
  }
  return path;
}
