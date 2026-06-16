/**
 * Probe North Star MD + Summit MD partner frontends (orders, analytics scope).
 * Usage: node scripts/probe-partner-portals.mjs
 */
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { applyProjectEnv } from "./loadEnv.mjs";

global.WebSocket = ws;

const env = applyProjectEnv();
const url = env.VITE_SUPABASE_URL;
const anon = env.VITE_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const PARTNERS = [
  {
    name: "North Star MD",
    slug: "north-star-md",
    brandId: "c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c",
    adminBase: "/care/north-star-md/admin",
    legacySubBrands: ["North Star MD", "north-star-md", "northstar"],
  },
  {
    name: "Summit MD",
    slug: "summit-md",
    brandId: "7caaa526-185e-4eda-bf0e-832be6ba37a7",
    adminBase: "/care/summit-md/admin",
    legacySubBrands: ["Summit MD", "summit-md", "summitmd"],
  },
];

const baseUrl = (env.PORTAL_CHECK_BASE_URL || "https://www.peak-health.io").replace(/\/$/, "");

function applyPartnerScope(q, brandId, legacyNames) {
  const names = [brandId, ...legacyNames];
  const parts = names.map((n) => `sub_brand.eq.${n}`);
  return q.or(parts.join(","));
}

async function main() {
  console.log("Partner portal probe\n");

  for (const p of PARTNERS) {
    console.log(`\n=== ${p.name} (${p.slug}) ===`);
    try {
      const res = await fetch(`${baseUrl}${p.adminBase}/login`);
      console.log(`HTTP ${p.adminBase}/login → ${res.status}`);
      const ar = await fetch(`${baseUrl}${p.adminBase}/analytics`);
      console.log(`HTTP ${p.adminBase}/analytics → ${ar.status}`);
      const or = await fetch(`${baseUrl}${p.adminBase}/orders`);
      console.log(`HTTP ${p.adminBase}/orders → ${or.status}`);
    } catch (e) {
      console.log("HTTP error:", e.message);
    }
  }

  const admin = serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false } })
    : null;

  if (!admin) {
    console.log("\nSUPABASE_SERVICE_ROLE_KEY unset — skipping order sub_brand breakdown");
    return;
  }

  console.log("\n=== Orders by sub_brand (service role) ===");
  const { data: orders, error } = await admin
    .from("orders")
    .select("sub_brand, ordered_date, created_at, amount, status")
    .limit(500);
  if (error) {
    console.error(error.message);
    return;
  }

  const bySub = {};
  for (const o of orders ?? []) {
    const k = o.sub_brand ?? "(null)";
    bySub[k] = (bySub[k] || 0) + 1;
  }
  console.log(bySub);

  for (const p of PARTNERS) {
    const uuidMatch = (orders ?? []).filter((o) => o.sub_brand === p.brandId);
    const legacyMatch = (orders ?? []).filter((o) =>
      p.legacySubBrands.includes(o.sub_brand ?? ""),
    );
    const anyMatch = (orders ?? []).filter(
      (o) =>
        o.sub_brand === p.brandId ||
        p.legacySubBrands.includes(o.sub_brand ?? "") ||
        (o.sub_brand ?? "").toLowerCase().includes(p.slug.replace(/-/g, "")),
    );

    console.log(`\n${p.name} order matches:`);
    console.log(`  sub_brand = UUID (${p.brandId}): ${uuidMatch.length}`);
    console.log(`  legacy name match: ${legacyMatch.length}`);
    console.log(`  any fuzzy match: ${anyMatch.length}`);

    // Simulate analytics scope (UUID only — current code path for non-Peak)
    const scopedUuidOnly = (orders ?? []).filter((o) => o.sub_brand === p.brandId);
    const scopedWithLegacy = anyMatch;
    console.log(`  analytics would show (UUID eq only): ${scopedUuidOnly.length} orders`);
    console.log(`  analytics would show (if legacy names matched): ${scopedWithLegacy.length} orders`);

    const { data: brandRow } = await admin
      .from("brands")
      .select("id, slug, name, status")
      .eq("slug", p.slug)
      .maybeSingle();
    console.log(`  brands row:`, brandRow ?? "MISSING");

    const { data: hostnames } = await admin
      .from("brand_hostnames")
      .select("hostname, host_kind, is_primary")
      .eq("brand_id", brandRow?.id ?? p.brandId);
    console.log(`  hostnames: ${hostnames?.length ?? 0}`);
  }

  // Peak brand admin on partner URL — tenant scope from path
  const c = createClient(url, anon, { auth: { persistSession: false } });
  const { data: auth } = await c.auth.signInWithPassword({
    email: "admin@peakbodyco.com",
    password: "password123",
  });
  if (auth?.user) {
    console.log("\n=== Peak brand_admin scoped to partner UUID (simulates /care/.../admin) ===");
    for (const p of PARTNERS) {
      let q = c.from("orders").select("id, sub_brand, amount").limit(10);
      q = q.eq("sub_brand", p.brandId);
      const { data, error: qe } = await q;
      console.log(
        `${p.name} (eq sub_brand=${p.brandId.slice(0, 8)}…): ${qe ? qe.message : `${data?.length ?? 0} rows`}`,
      );
    }
    await c.auth.signOut();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
