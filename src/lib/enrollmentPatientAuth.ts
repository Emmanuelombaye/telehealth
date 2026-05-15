import { supabase } from "./supabaseClient";
import { useAuthStore } from "./auth-store";

/** Set when finishing shop enrollment — forces /patient routing across reload until consumed. */
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

/**
 * After shop enrollment, force patient portal routing:
 * - clear staff dev-role override
 * - refresh JWT user_metadata.role = patient
 * - upsert profiles.role = patient
 * - session flag survives full page reload to /patient
 */
export async function ensurePatientPortalRoleAfterEnrollment(
  userId: string,
  email: string,
  fullName: string,
  firstName?: string,
  lastName?: string,
): Promise<void> {
  setForcePatientPortalIntent();

  try {
    await supabase.auth.updateUser({
      data: {
        role: "patient",
        first_name: firstName || fullName.split(/\s+/)[0] || "Patient",
        last_name: lastName || fullName.split(/\s+/).slice(1).join(" ") || "",
        full_name: fullName.trim() || "Patient",
      },
    });
    await supabase.auth.refreshSession();
  } catch (e) {
    console.warn("[enrollment] auth metadata refresh:", e);
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      role: "patient",
      email: email.trim().toLowerCase(),
      full_name: fullName.trim() || "Patient",
      status: "active",
    },
    { onConflict: "id" },
  );
  if (error) {
    console.warn("[enrollment] patient profile upsert:", error.message);
  }

  useAuthStore.setState({ role: "patient" });
}

/** Call right before navigating to /patient from enrollment complete UI. */
export function primePatientPortalNavigation(): void {
  setForcePatientPortalIntent();
  useAuthStore.setState({ role: "patient" });
}

/** Full navigation to patient dashboard (survives auth re-init on reload). */
export function navigateToPatientPortalAfterEnrollment(): void {
  primePatientPortalNavigation();
  const buster = `?enrolled=${Date.now()}`;
  window.location.href = `/patient${buster}`;
}
