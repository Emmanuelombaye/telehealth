/**
 * CI / deploy gate: required public env vars for a production build.
 * Usage:
 *   CI=true VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... VITE_STRIPE_PUBLISHABLE_KEY=... node scripts/production-preflight.mjs
 * Or: load secrets in GitHub Actions then run npm run check:production
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const p = join(root, ".env.local");
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

Object.assign(process.env, loadEnvLocal(), process.env);

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
