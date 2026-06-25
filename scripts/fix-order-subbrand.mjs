/**
 * fix-order-subbrand.mjs
 * Updates all PKH- orders to set sub_brand = DEFAULT_BRAND_ID
 * so the brand_admin dashboard filter picks them up correctly.
 */

const SUPABASE_URL = "https://vzzmdbdvcofajgrjgajq.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6em1kYmR2Y29mYWpncmpnYWpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2MjI5NCwiZXhwIjoyMDk2MzM4Mjk0fQ.UTaWWdHsCSBRG1ZP4Rsp1ixnhUeMIJurUvxpowBAhCM";

// This is what the dashboard filters by for brand_admin on peak-health.io
const DEFAULT_BRAND_ID = "a009d8db-c770-4287-a15e-cc82515437ef";
// Also recognised as a legacy key — set both to be safe
const LEGACY_SUB_BRAND = "Peak Health";

const HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function main() {
  console.log("🔧 Fixing sub_brand on all PKH- orders...");
  console.log(`   Setting sub_brand = "${DEFAULT_BRAND_ID}"`);

  // Patch all our seeded orders (order_number starts with PKH-)
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?order_number=like.PKH-*`,
    {
      method: "PATCH",
      headers: HEADERS,
      body: JSON.stringify({ sub_brand: DEFAULT_BRAND_ID }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PATCH failed (${res.status}): ${err}`);
  }

  console.log("   ✅ sub_brand updated on all PKH- orders!\n");

  // Also fix the existing 42 original orders that may have wrong/null sub_brand
  console.log("🔧 Checking original orders (non PKH- prefix)...");
  const res2 = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?order_number=not.like.PKH-*&select=id,order_number,sub_brand&limit=100`,
    { headers: HEADERS }
  );
  const origOrders = await res2.json();
  console.log(`   Found ${origOrders.length} original orders`);
  origOrders.slice(0, 5).forEach(o =>
    console.log(`   #${o.order_number} → sub_brand: "${o.sub_brand}"`)
  );

  // Verify total count visible to brand admin
  console.log("\n🔍 Verifying count with sub_brand filter...");
  const r3 = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?sub_brand=eq.${DEFAULT_BRAND_ID}&select=amount`,
    { headers: { ...HEADERS, Prefer: "count=exact", Range: "0-0" } }
  );
  const range = r3.headers.get("content-range");
  console.log(`   Orders visible to admin (sub_brand=${DEFAULT_BRAND_ID}): ${range}`);

  // Also sum revenue
  const r4 = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?sub_brand=eq.${DEFAULT_BRAND_ID}&select=amount`,
    { headers: HEADERS }
  );
  const rows = await r4.json();
  const total = rows.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
  console.log(`   Gross revenue visible: $${total.toLocaleString()}`);

  console.log("\n🎯 Refresh peak-health.io/admin — dashboard should update now!");
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
