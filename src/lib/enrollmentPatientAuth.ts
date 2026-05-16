import { supabase } from "./supabaseClient";
import { setForcePatientPortalIntent } from "./patientPortalIntent";

export {
  FORCE_PATIENT_PORTAL_KEY,
  setForcePatientPortalIntent,
  hasForcePatientPortalIntent,
  clearForcePatientPortalIntent,
} from "./patientPortalIntent";

/**
 * After shop enrollment, force patient portal routing:
 * - clear staff dev-role override
 * - refresh JWT user_metadata.role = patient
 * - upsert profiles.role = patient
 * - session flag survives full page reload to /patient
 *
 * Does not import auth-store (avoids circular module init / TDZ in production bundles).
 * Role in UI updates via `refreshSession` + `onAuthStateChange`; `hasForcePatientPortalIntent` wins in auth helpers until cleared.
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

  try {
    const { useAuthStore } = await import("./auth-store");
    useAuthStore.setState({ role: "patient" });
  } catch {
    /* non-fatal if chunk still loading */
  }
}

/** Call right before navigating to /patient from enrollment complete UI. */
export function primePatientPortalNavigation(): void {
  setForcePatientPortalIntent();
  void import("./auth-store").then(({ useAuthStore }) => {
    useAuthStore.setState({ role: "patient" });
  });
}

/** Full navigation to patient dashboard (survives auth re-init on reload). */
export function navigateToPatientPortalAfterEnrollment(portalPath = "/patient"): void {
  primePatientPortalNavigation();
  const base = portalPath.startsWith("/") ? portalPath : `/${portalPath}`;
  const buster = base.includes("?") ? `&enrolled=${Date.now()}` : `?enrolled=${Date.now()}`;
  window.location.href = `${base}${buster}`;
}
