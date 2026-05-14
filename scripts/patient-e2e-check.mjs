/**
 * Patient-facing backend smoke + optional authenticated E2E.
 *
 * Usage (from repo root `telehealth/`):
 *   node scripts/patient-e2e-check.mjs
 *
 * Loads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.local`.
 * Optional full path (sign-in + insert order like Shop checkout):
 *   PATIENT_E2E_EMAIL=...
 *   PATIENT_E2E_PASSWORD=...
 *
 * Exit 0 only if all executed steps pass.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  const p = join(root, ".env.local");
  if (!existsSync(p)) {
    console.error("Missing .env.local — copy from your Vercel / local env (VITE_SUPABASE_*).");
    process.exit(1);
  }
  const text = readFileSync(p, "utf8");
  const out = {};
  for (const line of text.split("\n")) {
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

const env = loadEnvLocal();
const url = env.VITE_SUPABASE_URL;
const anon = env.VITE_SUPABASE_ANON_KEY;
const e2eEmail = env.PATIENT_E2E_EMAIL?.trim();
const e2ePassword = env.PATIENT_E2E_PASSWORD;

if (!url || !anon) {
  console.error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local");
  process.exit(1);
}

const supabase = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function ok(msg) {
  console.log(`\x1b[32mPASS\x1b[0m ${msg}`);
}
function fail(msg, err) {
  console.error(`\x1b[31mFAIL\x1b[0m ${msg}`, err?.message || err || "");
  process.exit(1);
}

async function smokeAnonymous() {
  console.log("\n--- Anonymous API (matches unauthenticated app reads) ---\n");

  const { data: products, error: pe } = await supabase
    .from("products")
    .select("id,name,category,active,price_usd")
    .eq("active", true)
    .limit(3);
  if (pe) fail("products (active) readable", pe);
  if (!products?.length) fail("products (active) has at least one row", new Error("empty"));
  ok(`products: ${products.length} active row(s), e.g. "${products[0].name}"`);

  const { data: docs, error: de } = await supabase
    .from("doctor_availability")
    .select("id,name,available")
    .limit(5);
  if (de) fail("doctor_availability readable", de);
  ok(`doctor_availability: ${docs?.length ?? 0} row(s)`);

  const { error: authErr } = await supabase.auth.getSession();
  if (authErr) fail("auth.getSession()", authErr);
  ok("auth client responsive (no session)");
}

async function authenticatedPatientFlow() {
  console.log("\n--- Authenticated patient (PATIENT_E2E_*) ---\n");

  const { data: signIn, error: se } = await supabase.auth.signInWithPassword({
    email: e2eEmail,
    password: e2ePassword,
  });
  if (se) fail("signInWithPassword", se);
  const user = signIn.user;
  if (!user?.id) fail("sign-in returned no user id", new Error("no user"));

  ok(`signed in as ${e2eEmail} (${user.id})`);

  const { data: products, error: pe } = await supabase
    .from("products")
    .select("id,name,category,tagline,price_usd")
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  if (pe) fail("fetch one product", pe);
  if (!products) fail("need at least one active product", new Error("none"));

  const orderRef =
    "E2E-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

  const payload = {
    order_number: orderRef,
    patient_name: "E2E Script Patient",
    patient_avatar: "EP",
    patient_age: 35,
    patient_country: "US",
    sub_brand: "Peak Health",
    medication: products.name,
    dosage_instructions: products.tagline || "As directed",
    category: products.category,
    status: "order_submitted",
    ordered_date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    amount: products.price_usd ?? "199",
    user_id: user.id,
    intake_complete: true,
    intake_notes: "Automated patient-e2e-check.mjs — safe to delete",
    intake_answers: { source: "e2e-script" },
    patient_vitals: { height: "5'10\"", weight: "180 lbs", bmi: "25.8" },
    consultation_time: null,
    zoom_status: "not_requested",
    zoom_doctor_message: null,
    zoom_rescheduled_time: null,
    timeline: [{ status: "order_submitted", date: new Date().toLocaleDateString() }],
  };

  const { error: ie } = await supabase.from("orders").insert([payload]);
  if (ie) fail("orders.insert (patient checkout shape)", ie);
  ok(`orders.insert order_number=${orderRef}`);

  const { data: row, error: ve } = await supabase
    .from("orders")
    .select("order_number,status,user_id")
    .eq("order_number", orderRef)
    .single();
  if (ve) fail("orders.select verify", ve);
  if (row.user_id !== user.id) fail("RLS row user_id mismatch", new Error(JSON.stringify(row)));
  ok(`orders.verify read-back status=${row.status}`);

  const { data: mine, error: oe } = await supabase
    .from("orders")
    .select("order_number")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (oe) fail("orders list for patient", oe);
  const found = mine?.some((r) => r.order_number === orderRef);
  if (!found) fail("new order not in patient's list", new Error("not in last 20"));
  ok(`patient order list includes new order (${mine.length} recent)`);

  await supabase.auth.signOut();
  ok("signed out");
}

async function main() {
  console.log("Peak Health — patient backend E2E check");
  console.log("Project:", root);

  await smokeAnonymous();

  if (e2eEmail && e2ePassword) {
    await authenticatedPatientFlow();
  } else {
    console.log("\n--- Authenticated patient (skipped) ---");
    console.log(
      "Set PATIENT_E2E_EMAIL and PATIENT_E2E_PASSWORD in .env.local to test sign-in + order insert + read-back.\n"
    );
  }

  console.log("\n\x1b[32mAll executed checks passed.\x1b[0m");
  console.log(
    "Note: This does not run the browser (Shop UI, payments, ID upload). Optional auth steps prove the same Supabase paths the patient portal uses after login."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
