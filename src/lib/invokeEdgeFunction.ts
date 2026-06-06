/**
 * Browser-safe Supabase Edge Function invoke — passes session JWT and clear errors.
 */
import { supabase } from "./supabaseClient";

type InvokeOptions = {
  body?: Record<string, unknown>;
  /** When true (default), fails fast if there is no Supabase session JWT. */
  requireSession?: boolean;
};

export async function invokeEdgeFunction<T = unknown>(
  name: string,
  options: InvokeOptions = {},
): Promise<{ data: T | null; error: { message: string } | null }> {
  const { body, requireSession = true } = options;
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (requireSession && !token) {
    return {
      data: null,
      error: {
        message: `Not signed in with Supabase — "${name}" requires an active session.`,
      },
    };
  }

  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data, error } = await supabase.functions.invoke(name, { body, headers });

  if (error) {
    const raw = error.message ?? "Edge function failed";
    const notDeployed =
      raw.includes("Failed to send") ||
      raw.includes("fetch") ||
      raw.includes("404") ||
      raw.toLowerCase().includes("cors");
    const deployHint = notDeployed
      ? ` Deploy "${name}" in Supabase → Edge Functions (JWT verification OFF). CORS/404 means it is not deployed yet.`
      : "";
    const gatewayHint =
      raw.includes("401") || raw.includes("UNAUTHORIZED")
        ? ` Turn OFF "Enforce JWT Verification" for ${name} in Supabase Edge Functions → Settings.`
        : "";
    return { data: data as T | null, error: { message: raw + gatewayHint + deployHint } };
  }

  return { data: data as T | null, error: null };
}
