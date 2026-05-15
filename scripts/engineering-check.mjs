/**
 * Lightweight engineering sanity check (no DB connection).
 * Run: npm run check:engineering
 */
import { existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase", "migrations");
const required = [
  "20260514143000_production_core_rbac.sql",
  "20260514143100_profiles_rls_core.sql",
];

console.log("Peak Health — engineering check\n");

let ok = true;

if (!existsSync(migrationsDir)) {
  console.error("✖ Missing directory:", migrationsDir);
  ok = false;
} else {
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
  console.log("Migrations (" + files.length + "):", files.length ? files.join(", ") : "(none)");

  for (const name of required) {
    if (!files.includes(name)) {
      console.error("✖ Expected migration missing:", name);
      ok = false;
    } else {
      console.log("✓ Found", name);
    }
  }

  const recommended = [
    "20260515190000_admin_questionnaires_orders_columns_audit.sql",
    "20260516120000_scheduling_correlation_and_routing.sql",
  ];
  for (const name of recommended) {
    if (!files.includes(name)) {
      console.warn("⚠ Recommended migration missing (video / admin tables):", name);
    } else {
      console.log("✓ Found (recommended)", name);
    }
  }
}

const legacyReadme = join(root, "supabase", "LEGACY_SQL.md");
if (existsSync(legacyReadme)) {
  console.log("✓ Legacy SQL guardrail:", "supabase/LEGACY_SQL.md");
} else {
  console.warn("⚠ Missing supabase/LEGACY_SQL.md (recommended)");
}

const rollout = join(root, "docs", "ENGINEERING_ROLLOUT.md");
if (existsSync(rollout)) {
  console.log("✓ Rollout guide:", "docs/ENGINEERING_ROLLOUT.md");
} else {
  console.warn("⚠ Missing docs/ENGINEERING_ROLLOUT.md");
}

console.log("\nNext: follow docs/ENGINEERING_ROLLOUT.md → Step 3 (db push).");
console.log("Production env gate: CI=true + secrets → npm run check:production");
console.log("Scheduling / video gate: npm run check:scheduling-gate (after db push + env)\n");
process.exit(ok ? 0 : 1);
