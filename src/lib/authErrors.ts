import type { AuthError } from "@supabase/supabase-js";

/** User-facing message when Supabase sign-in fails. */
export function formatSupabaseSignInError(error: AuthError): string {
  const msg = (error.message || "").toLowerCase();
  if (error.status === 500 || msg.includes("unexpected") || msg.includes("server error")) {
    return "Authentication service error. Check Supabase Dashboard → Logs → Auth, or contact your administrator.";
  }
  if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) {
    return "Invalid email or password.";
  }
  if (msg.includes("email not confirmed")) {
    return "Email not confirmed. Ask an administrator to confirm your account in Supabase Auth.";
  }
  return error.message || "Authentication failed. Please try again.";
}
