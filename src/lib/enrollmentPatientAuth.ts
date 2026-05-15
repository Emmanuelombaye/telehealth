import { supabase } from "./supabaseClient";
import { useAuthStore } from "./auth-store";

/**
 * After shop enrollment, force patient portal routing:
 * - clear staff dev-role override (common cause of landing on /doctor)
 * - upsert profiles.role = patient
 * - sync auth store role before ProtectedRoute runs
 */
export async function ensurePatientPortalRoleAfterEnrollment(
  userId: string,
  email: string,
  fullName: string,
): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("peak_health_dev_role");
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

/** Call right before hard-navigating to /patient from enrollment complete UI. */
export function primePatientPortalNavigation(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("peak_health_dev_role");
  }
  useAuthStore.setState({ role: "patient" });
}
