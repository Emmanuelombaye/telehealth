export type PreflightIssue = {
  level: "error" | "warn";
  key: string;
  message: string;
};

function env(key: string): string | undefined {
  const v = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/**
 * Validates Vite env at runtime. Call once on app boot.
 * Does not validate Supabase Edge secrets (those are server-side).
 */
export function runProductionPreflight(): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  const prod = import.meta.env.PROD;

  if (!env("VITE_SUPABASE_URL")) {
    issues.push({ level: "error", key: "VITE_SUPABASE_URL", message: "Missing Supabase project URL." });
  }
  if (!env("VITE_SUPABASE_ANON_KEY")) {
    issues.push({ level: "error", key: "VITE_SUPABASE_ANON_KEY", message: "Missing Supabase anon key." });
  }

  if (prod && !env("VITE_STRIPE_PUBLISHABLE_KEY")) {
    issues.push({
      level: "error",
      key: "VITE_STRIPE_PUBLISHABLE_KEY",
      message: "Production build expects Stripe for real checkout.",
    });
  }

  if (!prod && !env("VITE_STRIPE_PUBLISHABLE_KEY")) {
    issues.push({
      level: "warn",
      key: "VITE_STRIPE_PUBLISHABLE_KEY",
      message: "Stripe key missing — use demo gateway in dev only.",
    });
  }

  return issues;
}
