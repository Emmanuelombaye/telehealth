/**
 * Diagnose why /admin/analytics shows zeros.
 * Usage: node scripts/probe-admin-analytics.mjs
 */
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { applyProjectEnv } from "./loadEnv.mjs";

global.WebSocket = ws;
function isAuditPlaceholderOrder(row) {
  const name = (row.patient_name ?? "").trim();
  if (/^Patient for /i.test(name)) return true;
  if (/^Audit Revenue Seed \(/i.test(name)) return true;
  const orderNum = (row.order_number ?? "").trim();
  if (/^SA-TEST-/i.test(orderNum)) return true;
  if (name.toLowerCase() === "audit medication" && row.medication === "Audit Medication") return true;
  return false;
}

const env = applyProjectEnv();
const url = env.VITE_SUPABASE_URL;
const anon = env.VITE_SUPABASE_ANON_KEY;

const LEGACY_PEAK_SUB_BRAND = "Peak Health";
const LEGACY_PEAK_BRAND_KEYS = new Set([
  "peak",
  "peak-health",
  "a009d8db-c770-4287-a15e-cc82515437ef",
]);

const ORDERS_SELECT =
  "id,order_number,user_id,patient_name,sub_brand,medication,status,ordered_date,amount,created_at";

function applyBrandScope(q, brandId) {
  const scoped = brandId || "";
  if (scoped && LEGACY_PEAK_BRAND_KEYS.has(scoped)) {
    return q.or(`sub_brand.eq.${scoped},sub_brand.eq.${LEGACY_PEAK_SUB_BRAND}`);
  }
  if (scoped) return q.eq("sub_brand", scoped);
  return q;
}

function inRange(orderedDate, days) {
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - days);
  const d = new Date(orderedDate);
  if (Number.isNaN(d.getTime())) return false;
  return d >= start;
}

function parseAmount(amount) {
  return parseFloat(String(amount ?? "").replace(/[$,]/g, "") || "0");
}

const c = createClient(url, anon, { auth: { persistSession: false } });
const { data: auth, error: loginErr } = await c.auth.signInWithPassword({
  email: "admin@peakbodyco.com",
  password: "password123",
});
if (loginErr) {
  console.error("Login failed:", loginErr.message);
  process.exit(1);
}

const brandId =
  auth.user?.app_metadata?.brand_id || auth.user?.user_metadata?.brand_id || null;
console.log("brand_admin:", auth.user?.email);
console.log("JWT brand_id:", brandId);

let q = c.from("orders").select(ORDERS_SELECT).order("created_at", { ascending: false });
q = applyBrandScope(q, brandId);
const { data, error } = await q;
if (error) {
  console.error("Orders query error:", error.message);
  process.exit(1);
}

const raw = data ?? [];
console.log("\n--- Raw orders from DB ---");
console.log("total rows:", raw.length);

const afterPlaceholder = raw.filter(
  (d) =>
    !isAuditPlaceholderOrder({
      patient_name: d.patient_name,
      order_number: d.order_number,
      medication: d.medication,
    }),
);
console.log("after placeholder filter:", afterPlaceholder.length);

function effectiveDate(o) {
  return o.ordered_date || o.created_at || "";
}

const noOrderedDate = afterPlaceholder.filter((o) => !effectiveDate(o));
const badDates = afterPlaceholder.filter((o) => {
  const ed = effectiveDate(o);
  if (!ed) return false;
  return Number.isNaN(new Date(ed).getTime());
});
const zeroAmount = afterPlaceholder.filter((o) => parseAmount(o.amount) === 0);

console.log("missing ordered_date:", noOrderedDate.length);
console.log("unparseable ordered_date:", badDates.length);
console.log("zero / empty amount:", zeroAmount.length);

console.log("missing ordered_date (have created_at fallback):", afterPlaceholder.filter((o) => !o.ordered_date).length);

for (const days of [7, 30, 90, 365]) {
  const inWindow = afterPlaceholder.filter((o) => effectiveDate(o) && inRange(effectiveDate(o), days));
  const rev = inWindow.reduce((s, o) => s + parseAmount(o.amount), 0);
  console.log(`in last ${days}D: ${inWindow.length} orders, revenue $${rev.toFixed(2)}`);
}

console.log("\n--- Sample rows (first 8) ---");
for (const o of afterPlaceholder.slice(0, 8)) {
  console.log({
    order_number: o.order_number,
    ordered_date: o.ordered_date,
    created_at: o.created_at,
    amount: o.amount,
    status: o.status,
    sub_brand: o.sub_brand,
  });
}

console.log("\n--- Status breakdown ---");
const statuses = {};
for (const o of afterPlaceholder) {
  statuses[o.status || "(null)"] = (statuses[o.status || "(null)"] || 0) + 1;
}
console.log(statuses);

await c.auth.signOut();
