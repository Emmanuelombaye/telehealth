/**
 * Verify doctor queue, appointments data, and two-brand linkage (API smoke).
 * Usage: node scripts/verify-doctor-brands.mjs
 */

import { createClient } from "@supabase/supabase-js";
import ws from "ws";

global.WebSocket = ws;

const url = process.env.VITE_SUPABASE_URL || "https://kvopgyhcjcniaocjozje.supabase.co";
const key =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "sb_publishable_wr1AUarSttsAd7_m3VAH1A_z0jhs2XZ";

const DOCTOR_EMAIL = process.env.DOCTOR_E2E_EMAIL || "doctor@peakbodyco.com";
const DOCTOR_PASSWORD = process.env.DOCTOR_E2E_PASSWORD || "password123";

const NORTH_STAR_ID = "c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c";
const PEAK_SLUG = "peak-health";

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function pass(msg) {
  console.log(`\x1b[32mPASS\x1b[0m ${msg}`);
}
function fail(msg, err) {
  console.error(`\x1b[31mFAIL\x1b[0m ${msg}`, err?.message || err || "");
}
function info(msg) {
  console.log(`\x1b[36mINFO\x1b[0m ${msg}`);
}

async function main() {
  console.log("Peak Health — doctor queue + brands verification\n");
  console.log("Project:", url, "\n");

  // --- Brands ---
  const { data: brands, error: be } = await supabase.from("brands").select("id,slug,name,status");
  if (be) fail("brands list", be);
  else {
    pass(`brands table: ${brands?.length ?? 0} row(s)`);
    const peak = brands?.find((b) => b.slug === PEAK_SLUG);
    const north = brands?.find((b) => b.slug === "north-star-md");
    if (peak) info(`Peak brand: ${peak.name} (${peak.id}) status=${peak.status}`);
    else fail("Peak brand slug peak-health missing");
    if (north) pass(`North Star MD brand row exists (${north.id})`);
    else fail("North Star MD brand missing — run PART 13 in RUN_IN_SUPABASE_FIX_ALL_DATABASE.sql");
  }

  // --- Anonymous queue peek (RLS may block in prod; informational) ---
  const { data: anonQueue, error: aq } = await supabase
    .from("orders")
    .select("order_number,status,sub_brand,consultation_time,zoom_status")
    .in("status", ["order_submitted", "medical_review", "id_verified", "intake_completed"])
    .limit(5);
  if (aq) info(`Anonymous queue read blocked (expected with strict RLS): ${aq.message}`);
  else info(`Anonymous queue visible: ${anonQueue?.length ?? 0} row(s)`);

  // --- Doctor login ---
  const { data: signIn, error: se } = await supabase.auth.signInWithPassword({
    email: DOCTOR_EMAIL,
    password: DOCTOR_PASSWORD,
  });
  if (se) {
    fail(`Doctor sign-in (${DOCTOR_EMAIL})`, se);
    console.log(
      "\nCreate doctor in Supabase Auth with app_metadata.role = doctor, or run init-staff.cjs.\n",
    );
    process.exit(1);
  }
  pass(`Doctor signed in: ${DOCTOR_EMAIL}`);

  const { data: profile, error: pe } = await supabase
    .from("profiles")
    .select("id,role,email,brand_id")
    .eq("id", signIn.user.id)
    .maybeSingle();
  if (pe) fail("profiles read for doctor", pe);
  else info(`Doctor profile: role=${profile?.role} brand_id=${profile?.brand_id || "(none)"}`);

  // --- Doctor clinical queue (same query as DoctorQueuePage) ---
  const { data: clinical, error: ce } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (ce) {
    fail("Doctor orders select (clinical)", ce);
    if (ce.code === "42P17") {
      console.error("→ RLS recursion: run RUN_IN_SUPABASE_FIX_ALL_DATABASE.sql in Supabase SQL Editor.");
    }
  } else {
    const queue = (clinical || []).filter((o) =>
      ["order_submitted", "medical_review", "id_verified", "intake_completed"].includes(o.status),
    );
    pass(`Doctor can read orders: ${clinical.length} total, ${queue.length} in active queue`);
    if (queue.length) {
      const sample = queue[0];
      info(
        `Sample queue item: ${sample.order_number} | ${sample.patient_name} | ${sample.status} | sub_brand=${sample.sub_brand}`,
      );
    } else {
      info("Queue empty — enroll a test patient or check order statuses.");
    }

    const byBrand = {};
    for (const o of clinical || []) {
      const k = o.sub_brand || "(empty)";
      byBrand[k] = (byBrand[k] || 0) + 1;
    }
    info(`Orders by sub_brand: ${JSON.stringify(byBrand)}`);
    const nsOrders = (clinical || []).filter(
      (o) => o.sub_brand === NORTH_STAR_ID || String(o.sub_brand || "").toLowerCase().includes("north"),
    );
    info(`North Star–tagged orders: ${nsOrders.length}`);
  }

  // --- Appointments / schedule signals ---
  const { data: withConsult, error: sc } = await supabase
    .from("orders")
    .select("order_number,consultation_time,zoom_status,enrollment_video_required")
    .not("consultation_time", "is", null)
    .limit(5);
  if (sc) info(`Scheduled orders probe: ${sc.message}`);
  else info(`Orders with consultation_time set: ${withConsult?.length ?? 0}`);

  const { data: docs, error: de } = await supabase
    .from("doctor_availability")
    .select("id,name,available,calendly_url")
    .limit(5);
  if (de) info(`doctor_availability: ${de.message}`);
  else pass(`doctor_availability: ${docs?.length ?? 0} provider row(s)`);

  await supabase.auth.signOut();
  pass("Signed out");

  console.log("\n--- Brand connection (code ↔ database) ---");
  console.log("Frontend North Star UUID:", NORTH_STAR_ID);
  console.log("Shop URL: /care/north-star-md/shop?brand=north-star-md&brandId=" + NORTH_STAR_ID);
  console.log("Orders use sub_brand column — North Star checkouts should set sub_brand to brand UUID or name.");

  const exitFail = !brands?.some((b) => b.slug === "north-star-md");
  process.exit(exitFail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
