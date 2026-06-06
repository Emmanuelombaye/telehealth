import type { AuthError } from "@supabase/supabase-js";

/** User-facing message when Supabase sign-in fails and demo credentials did not match. */
export function formatSupabaseSignInError(error: AuthError): string {
  const msg = (error.message || "").toLowerCase();
  if (error.status === 500 || msg.includes("unexpected") || msg.includes("server error")) {
    return "Supabase Auth is unavailable. Use the demo account shown above, or check Supabase Dashboard → Logs → Auth.";
  }
  if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) {
    return "Invalid email or password. Use the demo account shown above, or your live Supabase credentials.";
  }
  if (msg.includes("email not confirmed")) {
    return "Email not confirmed. Use the demo account above, or confirm the user in Supabase Auth.";
  }
  return error.message || "Authentication failed. Please try again.";
}
