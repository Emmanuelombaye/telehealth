/**
 * Verify new Supabase DB + all staff portal demo logins.
 * Loads .env.production / .env.local automatically.
 *
 *   npm run verify:portals
 */

import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { applyProjectEnv } from "./loadEnv.mjs";

global.WebSocket = ws;

const env = applyProjectEnv();
const url = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || "").trim();
const anon = (env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "").trim();
const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

const STAFF = [
  { portal: "Patient (shop)", role: null, email: null, password: null },
  { portal: "Super Admin", role: "super_admin", email: "brandon@peakbodyco.com", password: "@incorrect!" },
  { portal: "Doctor", role: "doctor", email: "doctor@peakbodyco.com", password: "password123" },
  { portal: "Brand Admin", role: "brand_admin", email: "admin@peakbodyco.com", password: "password123" },
  { portal: "Pharmacy", role: "pharmacy", email: "pharmacy@peakbodyco.com", password: "password123" },
  { portal: "Affiliate", role: "affiliate", email: "affiliate@peakbodyco.com", password: "password123" },
];

const FRONTENDS = [
  { name: "Main (patient)", url: "https://www.peak-health.io/patient/login" },
  { name: "Admin subdomain", url: "https://admin.peak-health.io/" },
  { name: "SuperAdmin subdomain", url: "https://superadmin.peak-health.io/" },
];

if (!url || !anon) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.production or .env.local");
  process.exit(1);
}

const pub = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
const admin = serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

function pass(msg) {
  console.log(`\x1b[32mPASS\x1b[0m ${msg}`);
}
function warn(msg) {
  console.warn(`\x1b[33mWARN\x1b[0m ${msg}`);
}
function fail(msg, err) {
  console.error(`\x1b[31mFAIL\x1b[0m ${msg}`, err?.message || err || "");
}

async function checkDb() {
  console.log("\n=== Database (Supabase) ===\n");
  let fails = 0;

  const { data: products, error: pe } = await pub.from("products").select("id,name").eq("active", true).limit(3);
  if (pe || !products?.length) {
    fail("products catalog", pe || new Error("empty"));
    fails++;
  } else pass(`products: ${products.length}+ active (${products[0].name})`);

  const { error: oe } = await pub.from("orders").select("id").limit(1);
  if (oe) {
    fail("orders table", oe);
    fails++;
  } else pass("orders table reachable");

  if (admin) {
    const { data: brands, error: be } = await admin.from("brands").select("id,name").limit(5);
    if (be) {
      fail("brands table", be);
      fails++;
    } else pass(`brands: ${brands?.length ?? 0} row(s)`);

    const { error: re } = await admin.rpc("get_auth_role");
    if (re) warn(`get_auth_role RPC: ${re.message} (run migrations if missing)`);
    else pass("get_auth_role RPC exists");

    const schemaChecks = [
      { table: "orders", column: "order_number" },
      { table: "visit_forms", column: null },
      { table: "visit_summaries", column: null },
      { table: "vital_readings", column: "flagged" },
      { table: "messages", column: "is_read" },
      { table: "notifications", column: null },
    ];

    for (const check of schemaChecks) {
      if (check.column) {
        const { error: ce } = await admin.from(check.table).select(check.column).limit(1);
        if (ce) {
          fail(`${check.table}.${check.column}`, ce);
          fails++;
        } else pass(`${check.table}.${check.column}`);
      } else {
        const { error: te } = await admin.from(check.table).select("id").limit(1);
        if (te) {
          fail(`${check.table} table`, te);
          fails++;
        } else pass(`${check.table} table`);
      }
    }
  } else {
    warn("SUPABASE_SERVICE_ROLE_KEY not set — skipping brands/admin probes");
  }

  return fails;
}

async function checkStaffAuth() {
  console.log("\n=== Staff portal logins (live Supabase) ===\n");
  let fails = 0;

  for (const account of STAFF) {
    if (!account.email) continue;
    const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });
    if (error) {
      fail(`${account.portal} (${account.email})`, error);
      fails++;
      continue;
    }
    const role =
      data.user?.app_metadata?.role || data.user?.user_metadata?.role || "(none)";
    if (role !== account.role) {
      warn(`${account.portal}: signed in but JWT role is "${role}" (expected ${account.role})`);
    } else {
      pass(`${account.portal}: ${account.email} → role ${role}`);
    }
    await client.auth.signOut();
  }

  return fails;
}

async function checkFrontends() {
  console.log("\n=== Three production frontends (HTTP) ===\n");
  let fails = 0;

  for (const front of FRONTENDS) {
    try {
      const res = await fetch(front.url, { redirect: "manual" });
      if (res.status >= 200 && res.status < 500) {
        pass(`${front.name}: ${front.url} → ${res.status}`);
      } else {
        fail(`${front.name}: ${front.url}`, new Error(`HTTP ${res.status}`));
        fails++;
      }
    } catch (e) {
      fail(`${front.name}: ${front.url}`, e);
      fails++;
    }
  }

  return fails;
}

async function main() {
  console.log("Peak Health — portal + database verification");
  console.log(`Project: ${url}\n`);

  const dbFails = await checkDb();
  const authFails = await checkStaffAuth();
  const httpFails = await checkFrontends();

  const total = dbFails + authFails + httpFails;
  console.log("\n=== Summary ===");
  if (total === 0) {
    console.log("\x1b[32mAll checks passed.\x1b[0m Demo UI login also works if Supabase auth is down.");
    process.exit(0);
  }
  console.error(`\x1b[31m${total} check group(s) failed.\x1b[0m`);
  if (authFails) {
    console.error("  → Run: npm run auth:provision-staff");
    console.error("  → Or use pre-filled demo login (bypasses Supabase) on each portal.");
  }
  if (dbFails) {
    console.error("  → Run scripts/sql/RUN_IN_SUPABASE_FIX_ALL_DATABASE.sql then RUN_IN_SUPABASE_SCHEMA_GAP_FIX.sql in Supabase SQL Editor.");
  }
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
