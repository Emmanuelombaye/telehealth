/**
 * CI / deploy gate: required public env vars for a production build.
 * Usage:
 *   CI=true VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... VITE_STRIPE_PUBLISHABLE_KEY=... node scripts/production-preflight.mjs
 * Or: load secrets in GitHub Actions then run npm run check:production
 */
const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
const requiredIfProd = ["VITE_STRIPE_PUBLISHABLE_KEY"];

const isCi = process.env.CI === "true";
const strict = process.env.PRODUCTION_PREFLIGHT_STRICT === "1" || isCi;

function missing(keys) {
  return keys.filter((k) => {
    const v = process.env[k];
    return typeof v !== "string" || !v.trim();
  });
}

console.log("Production preflight (Node env)\n");

const m1 = missing(required);
const m2 = strict ? missing(requiredIfProd) : [];

if (m1.length) {
  console.error("✖ Missing required:", m1.join(", "));
}
if (m2.length) {
  console.error("✖ Missing for strict/CI production gate:", m2.join(", "));
}

if (strict && (m1.length || m2.length)) {
  console.error("\nSet variables from .env.production.example on your CI host, then re-run.\n");
  process.exit(1);
}

if (!strict && (m1.length || m2.length)) {
  console.warn("⚠ Skipping fail (CI not set). For deploy gate: CI=true npm run check:production\n");
}

console.log(strict ? "✓ Required VITE_* variables present.\n" : "✓ Preflight finished (non-strict).\n");
process.exit(0);
