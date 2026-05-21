/**
 * Delete SuperAdmin audit orders (Patient for Peak Health / VitalCare / GlowRx).
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (server-only).
 *
 *   node scripts/delete-brand-placeholder-orders.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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

const env = { ...process.env, ...loadEnvLocal() };
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
      "Run scripts/sql/RUN_IN_SUPABASE_delete_brand_placeholder_orders.sql in Supabase SQL Editor instead.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PLACEHOLDER_OR =
  "patient_name.ilike.Patient for %,patient_name.ilike.Audit Revenue Seed (%),order_number.ilike.SA-TEST-%";

async function main() {
  const { data: preview, error: prevErr } = await supabase
    .from("orders")
    .select("id, order_number, patient_name, sub_brand")
    .or(PLACEHOLDER_OR);

  if (prevErr) {
    console.error("Preview failed:", prevErr.message);
    process.exit(1);
  }

  if (!preview?.length) {
    console.log("No placeholder audit orders found — nothing to delete.");
    process.exit(0);
  }

  console.log("Deleting", preview.length, "order(s):");
  for (const row of preview) {
    console.log(" -", row.order_number, "|", row.patient_name, "|", row.sub_brand);
  }

  await supabase.from("vital_readings").delete().ilike("patient_name", "Patient for %");

  const ids = preview.map((r) => r.id);
  const { error: delErr } = await supabase.from("orders").delete().in("id", ids);

  if (delErr) {
    console.error("Delete failed:", delErr.message);
    process.exit(1);
  }

  console.log("Done. Removed", ids.length, "audit order(s).");
}

main();
