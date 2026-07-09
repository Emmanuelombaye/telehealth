/**
 * Provision Pax Longevity for Partner API (service role — no SQL Editor needed).
 *
 *   node scripts/provision-pax-partner.mjs
 *   npm run auth:provision-pax
 *
 * Requires .env.production: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import ws from "ws";
import { applyProjectEnv } from "./loadEnv.mjs";

global.WebSocket = ws;

/** Stable UUID — must match src/lib/brands/pax.ts */
const PAX_BRAND_ID = "b7e8f9a0-1c2d-4e3f-9a5b-6c7d8e9f0a1b";

const PAX = {
  id: PAX_BRAND_ID,
  name: "Pax Longevity",
  slug: "pax",
  domain: "pax-longevity.com",
  portal_origin: "https://www.peak-health.io",
  logo_url: "https://www.pax-longevity.com/images/pax-logo.webp",
  settings: {
    marketing_url: "https://www.pax-longevity.com",
    tagline: "Prevent decline years before symptoms.",
    theme: {
      primary: "#A0594E",
      accent: "#C17D74",
      headerBg: "#FAF6F0",
    },
  },
};

const HOSTNAMES = [
  { hostname: "pax-longevity.com", host_kind: "marketing", is_primary: true },
  { hostname: "www.pax-longevity.com", host_kind: "marketing", is_primary: false },
  { hostname: "portal.pax-longevity.com", host_kind: "care", is_primary: true },
  { hostname: "care.pax-longevity.com", host_kind: "care", is_primary: false },
  { hostname: "admin.pax-longevity.com", host_kind: "admin", is_primary: true },
  { hostname: "affiliate.pax-longevity.com", host_kind: "affiliate", is_primary: true },
];

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

async function main() {
  const env = applyProjectEnv();
  const url = (env.VITE_SUPABASE_URL || "").trim();
  const key = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) {
    console.error("Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.production");
    process.exit(1);
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });

  const { data: existing } = await admin
    .from("brands")
    .select("id, slug, name")
    .or(`slug.eq.pax,id.eq.${PAX_BRAND_ID}`);

  let brandId = existing?.[0]?.id;

  const brandRow = {
    name: PAX.name,
    slug: PAX.slug,
    domain: PAX.domain,
    portal_origin: PAX.portal_origin,
    logo_url: PAX.logo_url,
    settings: PAX.settings,
    status: "active",
    plan: "Enterprise",
    compliance: { hipaa: true, gdpr: true, soc2: false },
    gateways: ["Stripe"],
    languages: ["English"],
    updated_at: new Date().toISOString(),
  };

  if (brandId) {
    const { error } = await admin.from("brands").update(brandRow).eq("id", brandId);
    if (error) throw error;
    console.log("Updated brand", brandId, "→ slug", PAX.slug);
  } else {
    const { data, error } = await admin
      .from("brands")
      .insert({ id: PAX.id, ...brandRow })
      .select("id")
      .single();
    if (error) throw error;
    brandId = data.id;
    console.log("Created brand", brandId);
  }

  for (const h of HOSTNAMES) {
    const { error } = await admin.from("brand_hostnames").upsert(
      { brand_id: brandId, ...h },
      { onConflict: "hostname" },
    );
    if (error) console.warn("hostname", h.hostname, error.message);
  }
  console.log("Hostnames upserted:", HOSTNAMES.length);

  const apiKey = `pk_live_px_${randomBytes(24).toString("hex")}`;
  const keyPrefix = apiKey.slice(0, 12);
  const keyHash = sha256Hex(apiKey);

  const { error: keyErr } = await admin.from("partner_api_keys").upsert(
    {
      brand_id: brandId,
      label: "default",
      key_prefix: keyPrefix,
      key_hash: keyHash,
      status: "active",
    },
    { onConflict: "brand_id,label" },
  );
  if (keyErr) throw keyErr;

  const apiBase = `${url.replace(/\/$/, "")}/functions/v1/partner-api`;
  const careBase = `${PAX.portal_origin}/care/${PAX.slug}`;

  console.log("\n=== Pax Longevity Partner API ready ===\n");
  console.log("Brand slug:      pax");
  console.log("Brand id:       ", brandId);
  console.log("API key (once): ", apiKey);
  console.log("\nCare portals (Peak-hosted):");
  console.log(`  Shop:      ${careBase}/shop`);
  console.log(`  Patient:   ${careBase}/login`);
  console.log(`  Admin:     ${careBase}/admin/login`);
  console.log(`  Affiliate: ${careBase}/affiliate/login`);
  console.log("\nPartner server env:");
  console.log(`  PARTNER_API_KEY=${apiKey}`);
  console.log(`  PARTNER_BRAND_SLUG=pax`);
  console.log(`  PARTNER_API_URL=${apiBase}`);
  console.log("\nPax marketing site (.env):");
  console.log(`  VITE_PAX_CARE_ORIGIN=${PAX.portal_origin}`);
  console.log(`  VITE_PAX_BRAND_SLUG=pax`);
  console.log(`  VITE_PAX_BRAND_ID=${brandId}`);
  console.log("\nVerify:");
  console.log(`  PARTNER_API_KEY=${apiKey} npm run check:partner-api`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
