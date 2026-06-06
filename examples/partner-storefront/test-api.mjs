/**
 * Automated Partner API test against partner-storefront server (mock or live).
 *
 *   npm run partner-storefront   # in another terminal
 *   npm run test:partner-storefront
 */

const BASE = process.env.PARTNER_STOREFRONT_URL || "http://localhost:5200";

function pass(msg) {
  console.log(`\x1b[32mPASS\x1b[0m ${msg}`);
}
function fail(msg) {
  console.error(`\x1b[31mFAIL\x1b[0m ${msg}`);
  process.exitCode = 1;
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

async function main() {
  console.log("Partner storefront API test\nBase:", BASE, "\n");

  try {
    await fetch(BASE);
  } catch {
    fail("Storefront server not running — run: npm run partner-storefront");
    return;
  }

  const health = await get("/api/health");
  if (!health.json.ok) fail("health: " + JSON.stringify(health.json));
  else pass(`health v${health.json.version} (${health.json.mode || "unknown"})`);

  const docs = await get("/api/docs");
  if (!docs.json.endpoints?.length) fail("docs missing endpoints");
  else pass(`docs: ${docs.json.endpoints.length} endpoints`);

  const brand = await get("/api/brand");
  if (!brand.json.brand?.slug) fail("brand missing slug");
  else pass(`brand: ${brand.json.brand.name}`);

  if (!brand.json.portals?.enrollment_url?.includes("/care/")) {
    fail("brand enrollment_url missing /care/ path");
  } else {
    pass("brand portals include branded /care/ URLs");
  }

  if (!brand.json.portals?.brand_admin_url?.includes("/admin/login")) {
    fail("brand_admin_url should point to branded admin login");
  } else {
    pass("brand_admin_url → branded admin login");
  }

  const catalog = await get("/api/catalog");
  if (!catalog.res.ok) fail("catalog: " + JSON.stringify(catalog.json));
  else pass(`catalog: ${catalog.json.products?.length ?? 0} product(s)`);

  const enroll = await post("/api/enrollment_start", {
    category: "weight-loss",
    portal_origin: "https://joinnorthstarmd.com",
  });
  if (!enroll.json.enrollment_url) fail("enrollment_start missing enrollment_url");
  else pass(`enrollment_start → ${enroll.json.enrollment_url.slice(0, 72)}…`);

  if (!process.exitCode) console.log("\n\x1b[32mPartner storefront API tests passed.\x1b[0m");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
