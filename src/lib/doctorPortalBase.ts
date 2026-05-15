import { useLocation } from "react-router";

/** Canonical provider portal URL prefix (also mirrors `/providers`). */
export function doctorPortalBaseFromPath(pathname: string): "/doctor" | "/providers" {
  return pathname.startsWith("/providers") ? "/providers" : "/doctor";
}

export function useDoctorPortalBase(): "/doctor" | "/providers" {
  const { pathname } = useLocation();
  return doctorPortalBaseFromPath(pathname);
}
