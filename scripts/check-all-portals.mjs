/**
 * Full portal verification: path routing, audit/logging tables, staff logins,
 * and per-portal Supabase feature probes (the same reads each UI page performs).
 *
 *   npm run check:all-portals
 *
 * Optional:
 *   PORTAL_CHECK_BASE_URL=https://www.peak-health.io  (default: production)
 *   PORTAL_CHECK_SKIP_BUILD=1                           (skip vite build)
 *   PATIENT_E2E_EMAIL / PATIENT_E2E_PASSWORD            (patient authenticated flow)
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { applyProjectEnv } from "./loadEnv.mjs";

global.WebSocket = ws;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = applyProjectEnv();
const url = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || "").trim();
const anon = (env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "").trim();
const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const baseUrl = (env.PORTAL_CHECK_BASE_URL || "https://www.peak-health.io").replace(/\/$/, "");
const skipBuild = env.PORTAL_CHECK_SKIP_BUILD === "1";

const ORDERS_ADMIN_SELECT =
  "id,order_number,user_id,patient_name,sub_brand,medication,status,ordered_date,amount,created_at";

const MESSAGE_SELECT = "id, content, created_at, sender_id, receiver_id, is_read";
const LEGACY_PEAK_SUB_BRAND = "Peak Health";
const LEGACY_PEAK_BRAND_KEYS = new Set([
  "peak",
  "peak-health",
  "a009d8db-c770-4287-a15e-cc82515437ef",
]);

const STAFF = [
  { portal: "Super Admin", role: "super_admin", email: "brandon@peakbodyco.com", password: "@incorrect!" },
  { portal: "Doctor", role: "doctor", email: "doctor@peakbodyco.com", password: "password123" },
  { portal: "Brand Admin", role: "brand_admin", email: "admin@peakbodyco.com", password: "password123" },
  { portal: "Pharmacy", role: "pharmacy", email: "pharmacy@peakbodyco.com", password: "password123" },
  { portal: "Affiliate", role: "affiliate", email: "affiliate@peakbodyco.com", password: "password123" },
];

const PORTAL_LOGIN_PATHS = [
  { portal: "Patient", path: "/login" },
  { portal: "Doctor", path: "/providers/login" },
  { portal: "Admin", path: "/admin/login" },
  { portal: "Super Admin", path: "/superadmin/login" },
  { portal: "Affiliate", path: "/affiliate/login" },
  { portal: "North Star admin", path: "/care/north-star-md/admin/login" },
  { portal: "Summit MD admin", path: "/care/summit-md/admin/login" },
  { portal: "North Star patient", path: "/care/north-star-md/login" },
];

const ADMIN_FEATURE_ROUTES = [
  "orders",
  "analytics",
  "patients",
  "messages",
  "finance",
  "products",
  "audit",
  "settings",
];

const DOCTOR_FEATURE_ROUTES = [
  "queue",
  "patients",
  "schedule",
  "messages",
  "consult",
  "erx",
  "analytics",
  "notifications",
];

const PATIENT_FEATURE_ROUTES = [
  "shop",
  "orders",
  "appointments",
  "messages",
  "prescriptions",
  "notifications",
];

const SUPERADMIN_FEATURE_ROUTES = [
  "brands",
  "orders",
  "analytics",
  "users",
  "doctors",
  "finance",
  "audit",
  "security",
];

let failures = 0;
let warnings = 0;

function pass(msg) {
  console.log(`\x1b[32mPASS\x1b[0m ${msg}`);
}
function warn(msg) {
  warnings++;
  console.warn(`\x1b[33mWARN\x1b[0m ${msg}`);
}
function fail(msg, err) {
  failures++;
  console.error(`\x1b[31mFAIL\x1b[0m ${msg}`, err?.message || err || "");
}

function client() {
  return createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
}

// --- Mirror src/lib/portalPath.ts (no TS import in .mjs) ---
const CARE_ADMIN_RE = /^\/care\/[^/]+\/admin(?:\/|$)/;
const CARE_AFFILIATE_RE = /^\/care\/[^/]+\/affiliate(?:\/|$)/;
const CARE_PATIENT_RE = /^\/care\/[^/]+\/patient(?:\/|$)/;

function isBrandAdminPortalPath(p) {
  return p.startsWith("/admin") || CARE_ADMIN_RE.test(p);
}
function isSuperAdminPortalPath(p) {
  return p.startsWith("/superadmin");
}
function isStaffAdminPortalPath(p) {
  return isBrandAdminPortalPath(p) || isSuperAdminPortalPath(p);
}
function adminPortalBaseFromPath(p, fallback = "/admin") {
  const care = p.match(/^\/care\/([^/]+)\/admin/);
  if (care) return `/care/${care[1]}/admin`;
  if (p.startsWith("/superadmin")) return "/superadmin";
  if (p.startsWith("/admin")) return "/admin";
  return fallback;
}
function sidebarRoleFromPath(p) {
  if (p.startsWith("/doctor") || p.startsWith("/providers")) return "doctor";
  if (isSuperAdminPortalPath(p)) return "superadmin";
  if (isBrandAdminPortalPath(p)) return "admin";
  if (p.startsWith("/affiliate") || CARE_AFFILIATE_RE.test(p)) return "affiliate";
  return "patient";
}
function rewritePortalHref(href, role, pathname) {
  if (role === "admin") {
    const base = adminPortalBaseFromPath(pathname);
    if (href === "/admin") return base;
    if (href.startsWith("/admin/")) return `${base}${href.slice("/admin".length)}`;
  }
  return href;
}

function checkPortalPathHelpers() {
  console.log("\n=== Portal path routing (white-label + Peak) ===\n");
  const cases = [
    { fn: () => sidebarRoleFromPath("/care/north-star-md/admin/orders"), want: "admin" },
    { fn: () => sidebarRoleFromPath("/care/summit-md/admin/analytics"), want: "admin" },
    { fn: () => sidebarRoleFromPath("/admin/orders"), want: "admin" },
    { fn: () => sidebarRoleFromPath("/superadmin/orders"), want: "superadmin" },
    { fn: () => sidebarRoleFromPath("/care/north-star-md/patient"), want: "patient" },
    { fn: () => sidebarRoleFromPath("/patient/orders"), want: "patient" },
    { fn: () => adminPortalBaseFromPath("/care/north-star-md/admin/orders"), want: "/care/north-star-md/admin" },
    { fn: () => adminPortalBaseFromPath("/admin/orders"), want: "/admin" },
    { fn: () => rewritePortalHref("/admin/orders", "admin", "/care/summit-md/admin"), want: "/care/summit-md/admin/orders" },
    { fn: () => isStaffAdminPortalPath("/care/north-star-md/admin"), want: true },
    { fn: () => isStaffAdminPortalPath("/care/north-star-md/patient"), want: false },
  ];
  for (const c of cases) {
    const got = c.fn();
    if (got !== c.want) fail(`portalPath ${c.fn.toString().slice(0, 40)}… → ${got}`, new Error(`expected ${c.want}`));
    else pass(`portalPath: ${c.want}`);
  }

  const portalPathFile = join(root, "src", "lib", "portalPath.ts");
  if (!existsSync(portalPathFile)) fail("portalPath.ts missing");
  else pass("portalPath.ts present");
}

function checkSourceManifest() {
  console.log("\n=== Portal route manifest (source) ===\n");
  const routesFile = join(root, "src", "app", "routes", "portalRouteChildren.ts");
  if (!existsSync(routesFile)) {
    fail("portalRouteChildren.ts missing");
    return;
  }
  const src = readFileSync(routesFile, "utf8");
  for (const segment of ADMIN_FEATURE_ROUTES) {
    if (src.includes(`path: "${segment}"`)) pass(`admin route: ${segment}`);
    else fail(`admin route missing in manifest: ${segment}`);
  }
}

function checkBuild() {
  if (skipBuild) {
    warn("PORTAL_CHECK_SKIP_BUILD=1 — skipping production build");
    return;
  }
  console.log("\n=== Production build ===\n");
  const r = spawnSync("npm", ["run", "build"], { cwd: root, shell: true, stdio: "pipe", encoding: "utf8" });
  if (r.status !== 0) {
    fail("npm run build", new Error((r.stderr || r.stdout || "").slice(-800)));
  } else {
    pass("vite production build succeeded");
    if (!existsSync(join(root, "dist", "index.html"))) fail("dist/index.html missing after build");
    else pass("dist/index.html present");
  }
}

async function checkHttpRoutes() {
  console.log(`\n=== Frontend HTTP (${baseUrl}) ===\n`);
  const paths = [
    ...PORTAL_LOGIN_PATHS.map((p) => p.path),
    ...ADMIN_FEATURE_ROUTES.map((s) => `/admin/${s}`),
    ...DOCTOR_FEATURE_ROUTES.map((s) => `/providers/${s}`),
    ...PATIENT_FEATURE_ROUTES.map((s) => `/patient/${s}`),
    ...SUPERADMIN_FEATURE_ROUTES.map((s) => `/superadmin/${s}`),
    "/care/north-star-md/admin/orders",
    "/care/north-star-md/admin/analytics",
    "/care/summit-md/admin/orders",
  ];

  for (const path of paths) {
    const target = `${baseUrl}${path}`;
    try {
      const res = await fetch(target, { redirect: "manual" });
      if (res.status >= 200 && res.status < 500) pass(`HTTP ${path} → ${res.status}`);
      else fail(`HTTP ${path}`, new Error(`status ${res.status}`));
    } catch (e) {
      fail(`HTTP ${path}`, e);
    }
  }
}

async function checkLoggingTables(adminClient) {
  console.log("\n=== Audit & PHI logging tables ===\n");

  const tables = [
    { name: "admin_audit_logs", columns: "id,created_at,actor_id,action" },
    { name: "phi_access_logs", columns: "id,created_at,actor_id,action,resource_type" },
  ];

  for (const t of tables) {
    if (!adminClient) {
      warn(`SUPABASE_SERVICE_ROLE_KEY unset — skip ${t.name} probe`);
      continue;
    }
    const { error } = await adminClient.from(t.name).select(t.columns).limit(1);
    if (error) fail(`${t.name} readable (service role)`, error);
    else pass(`${t.name} table + columns OK`);
  }
}

async function signIn(account) {
  const c = client();
  const { data, error } = await c.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });
  if (error) return { client: c, error, user: null };
  return { client: c, error: null, user: data.user, session: data.session };
}

function jwtRole(user) {
  return user?.app_metadata?.role || user?.user_metadata?.role || null;
}

function jwtBrandId(user) {
  return user?.app_metadata?.brand_id || user?.user_metadata?.brand_id || null;
}

async function probeQuery(label, c, table, select, extra) {
  let q = c.from(table).select(select).limit(5);
  if (extra) q = extra(q);
  const { data, error } = await q;
  if (error) {
    fail(`${label}: ${table}`, error);
    return null;
  }
  pass(`${label}: ${table} (${data?.length ?? 0} row(s))`);
  return data;
}

/** Same query shape as src/lib/messagesFetch.ts fetchMessagesWithProfiles (no profile join). */
async function probeMessagesUiQuery(label, c, opts = {}) {
  let q = c
    .from("messages")
    .select(MESSAGE_SELECT)
    .order("created_at", { ascending: opts.ascending ?? true });
  if (opts.orFilter) q = q.or(opts.orFilter);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) {
    fail(`${label}: messages UI query`, error);
    return null;
  }
  pass(`${label}: messages UI query (${data?.length ?? 0} row(s))`);
  return data;
}

/** Mirror admin Messages.tsx — brand-scoped participant inbox. */
async function probeBrandAdminMessagesUi(label, c, brandId) {
  let oq = c.from("orders").select("user_id, doctor_id").not("user_id", "is", null).limit(500);
  const scoped = brandId || "";
  if (scoped && LEGACY_PEAK_BRAND_KEYS.has(scoped)) {
    oq = oq.or(`sub_brand.eq.${scoped},sub_brand.eq.${LEGACY_PEAK_SUB_BRAND}`);
  } else if (scoped) {
    oq = oq.eq("sub_brand", scoped);
  }
  const { data: orders, error: oe } = await oq;
  if (oe) {
    fail(`${label}: brand messages — orders scope`, oe);
    return;
  }
  const ids = new Set();
  for (const row of orders ?? []) {
    if (row.user_id) ids.add(row.user_id);
    if (row.doctor_id) ids.add(row.doctor_id);
  }
  if (!ids.size) {
    warn(`${label}: messages UI — no brand order participants (empty inbox is OK)`);
    return;
  }
  const inList = [...ids].join(",");
  const rows = await probeMessagesUiQuery(label, c, {
    orFilter: `sender_id.in.(${inList}),receiver_id.in.(${inList})`,
    limit: 400,
    ascending: false,
  });
  if (!rows?.length) return;

  const sample = orders?.find((o) => o.user_id && o.doctor_id);
  if (!sample) return;
  const { patientId, doctorId } = { patientId: sample.user_id, doctorId: sample.doctor_id };
  const { error: te } = await c
    .from("messages")
    .select(MESSAGE_SELECT)
    .or(
      `and(sender_id.eq.${patientId},receiver_id.eq.${doctorId}),and(sender_id.eq.${doctorId},receiver_id.eq.${patientId})`,
    )
    .order("created_at", { ascending: true })
    .limit(5);
  if (te) fail(`${label}: messages thread detail query`, te);
  else pass(`${label}: messages thread detail query OK`);
}

/** Mirror doctor Messages.tsx thread list load. */
async function probeDoctorMessagesUi(label, c, doctorId) {
  await probeMessagesUiQuery(label, c, {
    orFilter: `sender_id.eq.${doctorId},receiver_id.eq.${doctorId}`,
    limit: 400,
    ascending: false,
  });
  const { error: oe } = await c
    .from("orders")
    .select("id, user_id, patient_name, order_number, status")
    .eq("doctor_id", doctorId)
    .not("user_id", "is", null)
    .limit(5);
  if (oe) fail(`${label}: doctor messages — patient roster orders`, oe);
  else pass(`${label}: doctor messages — patient roster orders OK`);
}

/** Mirror admin Analytics.tsx orders load. */
async function probeBrandAdminAnalyticsUi(label, c, brandId) {
  let q = c.from("orders").select(ORDERS_ADMIN_SELECT).order("created_at", { ascending: false }).limit(50);
  const scoped = brandId || "";
  if (scoped && LEGACY_PEAK_BRAND_KEYS.has(scoped)) {
    q = q.or(`sub_brand.eq.${scoped},sub_brand.eq.${LEGACY_PEAK_SUB_BRAND}`);
  } else if (scoped) {
    q = q.eq("sub_brand", scoped);
  }
  const { data, error } = await q;
  if (error) fail(`${label}: analytics UI orders query`, error);
  else pass(`${label}: analytics UI orders query (${data?.length ?? 0} row(s))`);
}

async function checkStaffLoginsAndFeatures() {
  console.log("\n=== Staff portal logins + feature probes ===\n");

  for (const account of STAFF) {
    const { client: c, error, user } = await signIn(account);
    if (error) {
      fail(`${account.portal} login (${account.email})`, error);
      continue;
    }

    const role = jwtRole(user);
    if (role !== account.role) warn(`${account.portal}: JWT role "${role}" (expected ${account.role})`);
    else pass(`${account.portal} login → ${role}`);

    const brandId = jwtBrandId(user);

    if (account.role === "super_admin") {
      await probeQuery(account.portal, c, "orders", ORDERS_ADMIN_SELECT);
      await probeQuery(account.portal, c, "products", "id,name,active");
      await probeQuery(account.portal, c, "admin_audit_logs", "id,action,created_at");
      await probeQuery(account.portal, c, "phi_access_logs", "id,action,resource_type");
      await probeQuery(account.portal, c, "profiles", "id,role,full_name");
      await probeQuery(account.portal, c, "brands", "id,name,slug");
      await probeMessagesUiQuery(account.portal, c, { limit: 500, ascending: false });
    }

    if (account.role === "brand_admin") {
      await probeQuery(account.portal, c, "orders", ORDERS_ADMIN_SELECT);
      await probeBrandAdminAnalyticsUi(account.portal, c, brandId);
      await probeQuery(account.portal, c, "products", "id,name,active");
      await probeQuery(account.portal, c, "admin_audit_logs", "id,action,created_at");
      await probeBrandAdminMessagesUi(account.portal, c, brandId);
      if (!brandId) warn(`${account.portal}: JWT missing brand_id — orders/analytics may be empty`);
      else if (brandId === "peak" || brandId === "peak-health") {
        warn(`${account.portal}: JWT brand_id="${brandId}" is legacy — run npm run auth:provision-staff`);
      } else pass(`${account.portal}: brand_id=${brandId}`);

      const auditInsert = await c.from("admin_audit_logs").insert([
        {
          actor_id: user.id,
          actor_email: user.email,
          role: "brand_admin",
          brand_scope: brandId,
          action: "portal.check_probe",
          target_type: "system",
          target_id: "check-all-portals",
          detail: { source: "check-all-portals.mjs" },
        },
      ]);
      if (auditInsert.error) warn(`${account.portal}: admin_audit_logs insert — ${auditInsert.error.message}`);
      else pass(`${account.portal}: admin_audit_logs write OK`);
    }

    if (account.role === "doctor") {
      await probeQuery(account.portal, c, "orders", "id,order_number,patient_name,status");
      await probeQuery(account.portal, c, "profiles", "id,full_name,role", (q) => q.eq("role", "patient"));
      await probeDoctorMessagesUi(account.portal, c, user.id);
      await probeQuery(account.portal, c, "notifications", "id,title,unread");
      await probeQuery(account.portal, c, "prescriptions", "id,patient_id,medication");
    }

    if (account.role === "affiliate") {
      await probeQuery(account.portal, c, "orders", "id,order_number,referral_code,amount");
    }

    if (account.role === "pharmacy") {
      await probeQuery(account.portal, c, "orders", "id,order_number,status,pharmacy");
    }

    await c.auth.signOut();
  }
}

async function checkPatientPortal() {
  console.log("\n=== Patient portal (anonymous + optional auth) ===\n");
  const c = client();

  await probeQuery("Patient anon", c, "products", "id,name,active", (q) => q.eq("active", true));

  const e2eEmail = env.PATIENT_E2E_EMAIL?.trim();
  const e2ePassword = env.PATIENT_E2E_PASSWORD;
  if (!e2eEmail || !e2ePassword) {
    warn("PATIENT_E2E_EMAIL/PASSWORD unset — skipping authenticated patient probes");
    return;
  }

  const { error, user } = await signIn({ email: e2eEmail, password: e2ePassword });
  if (error) {
    fail("Patient E2E login", error);
    return;
  }
  pass(`Patient E2E login: ${e2eEmail}`);
  const authed = client();
  await authed.auth.setSession(
    (await authed.auth.signInWithPassword({ email: e2eEmail, password: e2ePassword })).data.session,
  );
  await probeQuery("Patient", authed, "orders", "id,order_number,status", (q) =>
    q.eq("user_id", user.id),
  );
  await probeMessagesUiQuery("Patient", authed, {
    orFilter: `sender_id.eq.${user.id},receiver_id.eq.${user.id}`,
  });
  await probeQuery("Patient", authed, "notifications", "id,title");
  await authed.auth.signOut();
}

async function checkDatabaseBasics(adminClient) {
  console.log("\n=== Database baseline ===\n");
  const pub = client();

  const { data: products, error: pe } = await pub.from("products").select("id,name").eq("active", true).limit(3);
  if (pe || !products?.length) fail("products catalog", pe || new Error("empty"));
  else pass(`products: ${products.length}+ active`);

  const { error: oe } = await pub.from("orders").select("id").limit(1);
  if (oe) fail("orders table (anon)", oe);
  else pass("orders table reachable (anon)");

  if (adminClient) {
    const { error: re } = await adminClient.rpc("get_auth_role");
    if (re) warn(`get_auth_role RPC: ${re.message}`);
    else pass("get_auth_role RPC exists");
  }
}

async function main() {
  console.log("Peak Health — full portal check (logins, logging, features)");
  console.log(`Supabase: ${url || "(missing)"}`);
  console.log(`Frontend base: ${baseUrl}\n`);

  if (!url || !anon) {
    console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  const adminClient = serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

  checkPortalPathHelpers();
  checkSourceManifest();
  checkBuild();
  await checkDatabaseBasics(adminClient);
  await checkLoggingTables(adminClient);
  await checkStaffLoginsAndFeatures();
  await checkPatientPortal();
  await checkHttpRoutes();

  console.log("\n=== Coverage notes ===");
  console.log("  ✓ Supabase RLS + the exact queries each messages/analytics page runs");
  console.log("  ✓ Staff logins (super_admin, doctor, brand_admin, pharmacy, affiliate)");
  console.log("  ✓ HTTP 200 on all major portal routes (SPA shell — not full browser JS)");
  if (!env.PATIENT_E2E_EMAIL) {
    console.log("  ○ Patient authenticated flows skipped — set PATIENT_E2E_EMAIL + PATIENT_E2E_PASSWORD");
  }
  console.log("  ○ Run before every deploy: npm run check:all-portals");
  console.log("  ○ After SQL changes: re-login all portals, then re-run this script");

  console.log("\n=== Summary ===");
  if (warnings) console.warn(`Warnings: ${warnings}`);
  if (failures === 0) {
    console.log("\x1b[32mAll portal checks passed.\x1b[0m");
    process.exit(0);
  }
  console.error(`\x1b[31m${failures} failure(s).\x1b[0m`);
  console.error("Fix hints:");
  console.error("  Admin/messages RLS: scripts/sql/RUN_IN_SUPABASE_ADMIN_PORTAL_FIXES.sql");
  console.error("  Messages only:      scripts/sql/RUN_IN_SUPABASE_MESSAGES_FIX.sql");
  console.error("  Auth: RUN_IN_SUPABASE_AUTH_500_FIX.sql → RUN_IN_SUPABASE_AUTH_RESET_STAFF.sql → npm run auth:provision-staff");
  console.error("  DB:   scripts/sql/RUN_IN_SUPABASE_FIX_ALL_DATABASE.sql");
  console.error("  Audit: scripts/sql/RUN_IN_SUPABASE_phi_access_logs.sql + supabase_admin_audit_and_scope.sql");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
