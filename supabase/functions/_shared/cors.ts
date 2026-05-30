/** Standard CORS headers for browser-invoked Edge Functions. */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, prefer",
};

/** OPTIONS preflight — must return HTTP 2xx before the gateway JWT check (see config.toml verify_jwt). */
export function corsPreflightResponse(): Response {
  return new Response("ok", { status: 200, headers: corsHeaders });
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
