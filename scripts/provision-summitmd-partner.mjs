/**
 * Provision Summit MD for Partner API (service role — no SQL Editor needed).
 *
 *   node scripts/provision-summitmd-partner.mjs
 *
 * Requires .env.production: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import ws from "ws";
import { applyProjectEnv } from "./loadEnv.mjs";

global.WebSocket = ws;

const SUMMIT = {
  name: "Summit MD",
  slug: "summit-md",
  domain: "summitmd.vercel.app",
  portal_origin: "https://www.peak-health.io",
};

const HOSTNAMES = [
  { hostname: "summitmd.vercel.app", host_kind: "marketing", is_primary: true },
  { hostname: "summitmd.com", host_kind: "marketing", is_primary: false },
  { hostname: "www.summitmd.com", host_kind: "marketing", is_primary: false },
  { hostname: "care.summitmd.com", host_kind: "care", is_primary: true },
  { hostname: "admin.summitmd.com", host_kind: "admin", is_primary: true },
  { hostname: "affiliate.summitmd.com", host_kind: "affiliate", is_primary: true },
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

  // Find existing summit row (slug `s` or summit-md)
  const { data: existing } = await admin
    .from("brands")
    .select("id, slug, name")
    .or("slug.eq.s,slug.eq.summit-md,name.ilike.summit%");

  let brandId = existing?.[0]?.id;

  if (brandId) {
    const { error } = await admin
      .from("brands")
      .update({
        name: SUMMIT.name,
        slug: SUMMIT.slug,
        domain: SUMMIT.domain,
        portal_origin: SUMMIT.portal_origin,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", brandId);
    if (error) throw error;
    console.log("Updated brand", brandId, "→ slug", SUMMIT.slug);
  } else {
    const { data, error } = await admin
      .from("brands")
      .insert({
        name: SUMMIT.name,
        slug: SUMMIT.slug,
        domain: SUMMIT.domain,
        portal_origin: SUMMIT.portal_origin,
        status: "active",
        plan: "Enterprise",
        compliance: { hipaa: true, gdpr: true, soc2: false },
        gateways: ["Stripe"],
        languages: ["English"],
      })
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

  const apiKey = `pk_live_sm_${randomBytes(24).toString("hex")}`;
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

  console.log("\n=== Summit MD Partner API ready ===\n");
  console.log("Brand slug:     summit-md");
  console.log("Brand id:       ", brandId);
  console.log("API key (once): ", apiKey);
  console.log("\nPartner server env:");
  console.log(`  PARTNER_API_KEY=${apiKey}`);
  console.log(`  PARTNER_BRAND_SLUG=summit-md`);
  console.log(`  PARTNER_API_URL=${apiBase}`);
  console.log("\nDocs:");
  console.log(`  Swagger UI: ${apiBase}?action=docs_ui`);
  console.log(`  OpenAPI:    ${apiBase}?action=openapi`);
  console.log("\nVerify:");
  console.log(`  PARTNER_API_KEY=${apiKey} npm run check:partner-api`);
  console.log(`  PARTNER_API_KEY=${apiKey} PARTNER_API_LIVE=1 npm run partner-storefront`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
