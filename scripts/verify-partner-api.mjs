/**
 * Verify Partner API deployment and auth.
 *
 * Usage:
 *   node scripts/verify-partner-api.mjs
 *   PARTNER_API_KEY=xxx node scripts/verify-partner-api.mjs
 *
 * Loads PARTNER_API_KEY from .env.local if present.
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
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[t.slice(0, i).trim()] = v;
  }
  return out;
}

const env = { ...loadEnvLocal(), ...process.env };
const supabaseUrl = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || "").replace(/\/$/, "");
const API_BASE =
  env.PARTNER_API_URL ||
  (supabaseUrl ? `${supabaseUrl}/functions/v1/partner-api` : "") ||
  "https://vzzmdbdvcofajgrjgajq.supabase.co/functions/v1/partner-api";
const KEY = env.PARTNER_API_KEY || "";
const BRAND = env.PARTNER_BRAND_SLUG || "summit-md";

function pass(msg) {
  console.log(`\x1b[32mPASS\x1b[0m ${msg}`);
}
function fail(msg) {
  console.error(`\x1b[31mFAIL\x1b[0m ${msg}`);
  process.exitCode = 1;
}
function skip(msg) {
  console.log(`\x1b[33mSKIP\x1b[0m ${msg}`);
}

async function get(action, headers = {}) {
  const res = await fetch(`${API_BASE}?action=${action}`, { headers });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

async function main() {
  console.log("Partner API verification\nBase:", API_BASE, "\n");

  const health = await get("health");
  if (health.res.status === 404 || health.json.message?.includes("not found")) {
    fail("partner-api not deployed — run: npx supabase functions deploy partner-api");
    return;
  }
  if (!health.json.ok) {
    fail("health check failed: " + JSON.stringify(health.json));
    return;
  }
  pass(`health v${health.json.version} (auth configured: ${health.json.auth_configured})`);

  const docs = await get("docs");
  if (docs.json.endpoints?.length) {
    pass(`docs index: ${docs.json.endpoints.length} endpoints listed`);
  } else {
    fail("docs action missing or invalid");
  }

  const openapi = await get("openapi");
  if (openapi.json.openapi === "3.0.3" && openapi.json.paths) {
    pass(`openapi spec: ${Object.keys(openapi.json.paths).length} path(s)`);
  } else {
    fail("openapi action missing or invalid (deploy latest partner-api)");
  }

  const docsUi = await fetch(`${API_BASE}?action=docs_ui`);
  if (docsUi.ok && (await docsUi.text()).includes("swagger-ui")) {
    pass("docs_ui serves interactive Swagger page");
  } else {
    fail("docs_ui missing or invalid (deploy latest partner-api)");
  }

  const unauth = await fetch(`${API_BASE}?action=catalog&brand_slug=${BRAND}`);
  if (unauth.status === 401) pass("catalog rejects missing API key (401)");
  else fail(`expected 401 without key, got ${unauth.status}`);

  if (!KEY) {
    skip("PARTNER_API_KEY not set — skipping authenticated tests");
    console.log("\nSet PARTNER_API_KEY in .env.local or env to test catalog + enrollment_start.");
    return;
  }

  const headers = { "X-Partner-Api-Key": KEY };

  const brandRes = await fetch(`${API_BASE}?action=brand&brand_slug=${BRAND}`, { headers });
  const brandJson = await brandRes.json();
  if (!brandRes.ok) fail(`brand: ${brandJson.error ?? brandRes.status}`);
  else pass(`brand: ${brandJson.brand?.name} → ${brandJson.portals?.enrollment_url?.slice(0, 60)}…`);

  const catRes = await fetch(`${API_BASE}?action=catalog&brand_slug=${BRAND}`, { headers });
  const catJson = await catRes.json();
  if (!catRes.ok) fail(`catalog: ${catJson.error ?? catRes.status}`);
  else pass(`catalog: ${catJson.products?.length ?? 0} product(s)`);

  const enrollRes = await fetch(API_BASE, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "enrollment_start",
      brand_slug: BRAND,
      portal_origin: "https://www.peak-health.io",
    }),
  });
  const enrollJson = await enrollRes.json();
  if (!enrollRes.ok) fail(`enrollment_start: ${enrollJson.error ?? enrollRes.status}`);
  else pass(`enrollment_start → ${enrollJson.enrollment_url?.slice(0, 70)}…`);

  if (!process.exitCode) console.log("\n\x1b[32mPartner API checks passed.\x1b[0m");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
