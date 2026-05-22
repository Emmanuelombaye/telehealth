/**
 * Staging / pre-prod gate: conditional video + scheduling stack (read-only).
 *
 * What it verifies (without mutating data):
 * 1) Recommended migration files exist on disk.
 * 2) At least one active product looks "video-capable" and at least one does not (catalog sanity).
 * 3) Optional — if SUPABASE_SERVICE_ROLE_KEY (or SCHEDULING_GATE_SERVICE_ROLE_KEY) is set:
 *    orders row probe for scheduling_booking_url / scheduling_ref, consult_routing_rules, scheduling_pending_bookings.
 *
 * Usage:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/scheduling-production-gate.mjs
 *   # deeper checks (local / CI secret — never commit the key):
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/scheduling-production-gate.mjs
 *
 * Exit: 0 unless a hard failure (missing URLs, migration files when strict).
 * Strict: SCHEDULING_GATE_STRICT=1 — fail if no video-flagged product or missing scheduling migration file.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

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
const migrationsDir = join(root, "supabase", "migrations");

const strict = process.env.SCHEDULING_GATE_STRICT === "1";

const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
const anon = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
const serviceKey = (
  process.env.SCHEDULING_GATE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  ""
).trim();

const recommendedMigrations = [
  "20260516120000_scheduling_correlation_and_routing.sql",
  "20260515190000_admin_questionnaires_orders_columns_audit.sql",
];

function productLooksVideoCapable(features) {
  if (!features || typeof features !== "object" || Array.isArray(features)) return false;
  const f = features;
  if (f.requires_video_consult === true || f.requires_sync_visit === true) return true;
  if (Array.isArray(f.video_required_states) && f.video_required_states.length > 0) return true;
  const u =
    f.scheduling_embed_url ||
    f.scheduling_url ||
    f.cal_booking_url;
  if (typeof u === "string" && /^https?:\/\//i.test(u.trim())) return true;
  const vc = f.video_clinical_rules;
  if (vc && typeof vc === "object" && !Array.isArray(vc) && Object.keys(vc).length > 0) return true;
  return false;
}

console.log("Peak Health — scheduling / conditional video production gate (read-only)\n");

let hardFail = false;
let warnings = 0;

/* --- Disk: migrations --- */
if (!existsSync(migrationsDir)) {
  console.error("✖ Missing:", migrationsDir);
  hardFail = true;
} else {
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
  for (const name of recommendedMigrations) {
    if (files.includes(name)) {
      console.log("✓ Migration on disk:", name);
    } else {
      console.warn("⚠ Recommended migration missing:", name);
      warnings++;
      if (strict) hardFail = true;
    }
  }
}

/* --- Env --- */
if (!url || !/^https?:\/\//i.test(url)) {
  console.error("✖ Set VITE_SUPABASE_URL or SUPABASE_URL (https)");
  hardFail = true;
}
if (!anon) {
  console.error("✖ Set VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY for product catalog probe");
  hardFail = true;
}

if (hardFail) {
  console.error("\nFix the items above, then re-run.\n");
  process.exit(1);
}

/* --- Anon: active products (public catalog path) --- */
const supabaseAnon = createClient(url, anon, { auth: { persistSession: false } });

const { data: products, error: pErr } = await supabaseAnon
  .from("products")
  .select("id,name,features,active")
  .eq("active", true)
  .limit(200);

if (pErr) {
  console.warn("⚠ Could not list active products (RLS or schema):", pErr.message);
  warnings++;
} else {
  const rows = products || [];
  let videoish = 0;
  let plain = 0;
  for (const row of rows) {
    if (productLooksVideoCapable(row.features)) videoish++;
    else plain++;
  }
  console.log(`✓ Active products fetched: ${rows.length} (anon)`);
  console.log(`   · video-rule-capable (features): ${videoish}`);
  console.log(`   · no video flags in features:   ${plain}`);
  if (rows.length === 0) {
    console.warn("⚠ No active products — shop catalog empty for this project");
    warnings++;
  }
  if (strict && videoish === 0) {
    console.error("✖ Strict mode: need ≥1 active product with video/scheduling signals in features");
    hardFail = true;
  }
  if (rows.length > 0 && videoish === 0) {
    console.warn(
      "⚠ No product has requires_video_consult / video_required_states / scheduling URL / clinical rules — conditional video path never triggers until configured"
    );
    warnings++;
  }
  if (rows.length > 0 && plain === 0) {
    console.warn("⚠ Every active product looks video-capable — confirm that is intentional");
    warnings++;
  }
}

/* --- Optional service-role: schema + orders probe --- */
if (serviceKey) {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { error: oErr } = await admin.from("orders").select("id,scheduling_ref,scheduling_booking_url").limit(1);
  if (oErr) {
    const msg = (oErr.message || "").toLowerCase();
    if (msg.includes("scheduling_booking_url") || msg.includes("scheduling_ref") || msg.includes("column")) {
      console.warn("⚠ orders scheduling columns: not all present — run latest migrations (scheduling_correlation)");
      warnings++;
    } else {
      console.warn("⚠ orders probe:", oErr.message);
      warnings++;
    }
  } else {
    console.log("✓ orders scheduling_ref / scheduling_booking_url selectable (service role)");
  }

  const { error: rErr } = await admin.from("consult_routing_rules").select("id").limit(1);
  if (rErr) {
    console.warn("⚠ consult_routing_rules:", rErr.message, "(optional table)");
    warnings++;
  } else {
    console.log("✓ consult_routing_rules reachable");
  }

  const { error: sErr } = await admin.from("scheduling_pending_bookings").select("id").limit(1);
  if (sErr) {
    console.warn("⚠ scheduling_pending_bookings:", sErr.message, "(Calendly early-booking merge)");
    warnings++;
  } else {
    console.log("✓ scheduling_pending_bookings reachable");
  }
} else {
  console.log("○ Deep DB probes skipped (no SUPABASE_SERVICE_ROLE_KEY). Set it locally for full gate.\n");
}

console.log("\nManual smoke (staging):");
console.log("  1) Flag exactly one test product with requires_video_consult + optional scheduling_embed_url.");
console.log("  2) Patient: shop → that product → last intake step → embed loads; submit order.");
console.log("  3) Patient: /patient/appointments — order appears; Book Time opens correct URL.");
console.log("  4) Configure DB webhook → email-trigger on orders INSERT when zoom_status=requested.");
console.log("  5) Calendly webhook → calendly-webhook; optional merge-scheduling-pending after submit.\n");

if (hardFail) {
  process.exit(1);
}
if (warnings && strict) {
  process.exit(1);
}
console.log(warnings ? `Done with ${warnings} warning(s).\n` : "All automated checks passed.\n");
process.exit(0);
