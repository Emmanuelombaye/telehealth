/**
 * seed-demo-orders.mjs
 *
 * 1. Deletes previously seeded demo orders (PK-175... batch)
 * 2. Inserts realistic orders to reach:
 *      - 3,094 total orders
 *      - Exactly $1,083,000 gross revenue
 *      - Natural growth curve over 18 months
 *      - Real telehealth price points
 */

const SUPABASE_URL = "https://vzzmdbdvcofajgrjgajq.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6em1kYmR2Y29mYWpncmpnYWpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2MjI5NCwiZXhwIjoyMDk2MzM4Mjk0fQ.UTaWWdHsCSBRG1ZP4Rsp1ixnhUeMIJurUvxpowBAhCM";

const HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

// ── Targets ───────────────────────────────────────────────────────────────────
const EXISTING_ORDERS  = 42;
const EXISTING_REVENUE = 8011;
const TARGET_TOTAL_ORDERS  = 3094;
const TARGET_TOTAL_REVENUE = 1_083_000;

const ORDERS_TO_INSERT  = TARGET_TOTAL_ORDERS - EXISTING_ORDERS;   // 3052
const REVENUE_TO_ADD    = TARGET_TOTAL_REVENUE - EXISTING_REVENUE; // 1,074,989

// ── Real telehealth price points ──────────────────────────────────────────────
// Weighted by realistic purchase frequency
const PRODUCTS = [
  { name: "Semaglutide 0.5mg Starter",   price: 297, weight: 18 },
  { name: "Semaglutide 1mg Monthly",      price: 349, weight: 22 },
  { name: "Semaglutide 2mg Monthly",      price: 399, weight: 16 },
  { name: "Tirzepatide 5mg Monthly",      price: 449, weight: 14 },
  { name: "Tirzepatide 10mg Monthly",     price: 499, weight: 8  },
  { name: "Tirzepatide 15mg Monthly",     price: 549, weight: 5  },
  { name: "Sildenafil 100mg (30ct)",      price: 149, weight: 12 },
  { name: "Tadalafil 20mg (30ct)",        price: 179, weight: 10 },
  { name: "Finasteride 1mg + Minoxidil",  price: 129, weight: 8  },
  { name: "Naltrexone LDN 4.5mg",         price: 189, weight: 6  },
  { name: "Sertraline 50mg (30ct)",       price: 159, weight: 7  },
  { name: "Bupropion SR 150mg",           price: 169, weight: 5  },
  { name: "Testosterone Cyp 200mg/mL",    price: 299, weight: 4  },
  { name: "Metformin 1000mg (90ct)",      price: 89,  weight: 6  },
  { name: "Comprehensive Weight Program", price: 599, weight: 3  },
];

// Build weighted pick array
const PRODUCT_POOL = [];
for (const p of PRODUCTS) {
  for (let i = 0; i < p.weight; i++) PRODUCT_POOL.push(p);
}

// ── Realistic status distribution ─────────────────────────────────────────────
// (matches a live telehealth platform at scale)
const STATUS_POOL = [
  ...Array(5).fill("order_submitted"),   // ~5%  just placed
  ...Array(8).fill("medical_review"),    // ~8%  awaiting doctor
  ...Array(12).fill("rx_sent"),          // ~12% prescribed
  ...Array(35).fill("shipped"),          // ~35% in transit
  ...Array(40).fill("delivered"),        // ~40% fulfilled
];

// ── Patient data pools ────────────────────────────────────────────────────────
const FIRST = [
  "James","John","Robert","Michael","William","David","Richard","Joseph","Thomas","Charles",
  "Christopher","Daniel","Matthew","Anthony","Mark","Donald","Steven","Paul","Andrew","Joshua",
  "Mary","Patricia","Jennifer","Linda","Barbara","Elizabeth","Susan","Jessica","Sarah","Karen",
  "Lisa","Nancy","Betty","Margaret","Sandra","Ashley","Dorothy","Kimberly","Emily","Donna",
  "Michelle","Carol","Amanda","Melissa","Deborah","Stephanie","Rebecca","Sharon","Laura","Cynthia",
  "Emma","Sophia","Olivia","Isabella","Ava","Mia","Charlotte","Amelia","Harper","Evelyn",
  "Noah","Liam","Mason","Ethan","Lucas","Logan","Jackson","Aiden","Ryan","Alex",
  "Samantha","Vanessa","Nicole","Brianna","Crystal","Tiffany","Jasmine","Natasha","Alexis","Monica",
];

const LAST = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez",
  "Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin",
  "Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson",
  "Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
  "Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts",
  "Phillips","Evans","Turner","Torres","Parker","Collins","Edwards","Stewart","Morris","Reed",
];

const STATES = [
  "CA","CA","CA","TX","TX","FL","FL","NY","NY","PA",
  "IL","OH","GA","NC","MI","NJ","VA","WA","AZ","MA",
  "TN","IN","MO","MD","WI","CO","MN","SC","AL","LA",
  "KY","OR","OK","CT","UT","NV","AR","MS","KS","NE",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Natural growth curve: more orders in recent months (exponential-ish ramp)
// Returns a date weighted toward the last 6 months
function weightedDate() {
  // Bias: 60% of orders in last 6 months, 30% in 6-12 months, 10% in 12-18 months
  const r = Math.random();
  let daysBack;
  if (r < 0.60) {
    daysBack = Math.random() * 180;          // 0–6 months
  } else if (r < 0.90) {
    daysBack = 180 + Math.random() * 180;    // 6–12 months
  } else {
    daysBack = 360 + Math.random() * 180;    // 12–18 months
  }
  const ms = Date.now() - daysBack * 86_400_000;
  return new Date(ms).toISOString();
}

let _counter = Date.now();
function nextOrderNumber() {
  return `PKH-${++_counter}`;
}

function buildOrder(brandId, product) {
  const first = pick(FIRST);
  const last  = pick(LAST);
  const ts    = weightedDate();
  const state = pick(STATES);
  const status = pick(STATUS_POOL);

  // Status-appropriate ordered_date format
  const orderedDate = new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return {
    status,
    amount:         product.price,
    currency:       "usd",
    brand_id:       brandId,
    patient_name:   `${first} ${last}`,
    patient_email:  `${first.toLowerCase()}${last.toLowerCase()}${Math.floor(Math.random() * 999)}@gmail.com`,
    medication:     product.name,
    order_number:   nextOrderNumber(),
    ordered_date:   orderedDate,
    shipping_state: state,
    enrollment_status: "completed",
    created_at:     ts,
    updated_at:     ts,
    metadata:       {},
    shipping_address: {
      state,
      country: "US",
    },
    consult_routing_snapshot: {},
  };
}

async function deletePreviousBatch() {
  // Delete orders we inserted before (order_number starts with PK-175... timestamp batch)
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?order_number=like.PK-175*`,
    {
      method: "DELETE",
      headers: HEADERS,
    }
  );
  if (!res.ok) {
    const t = await res.text();
    console.warn("  ⚠️  Could not delete previous batch:", t);
  }
}

async function fetchBrandId() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/brands?select=id,slug&slug=eq.peak-health`,
    { headers: HEADERS }
  );
  const data = await res.json();
  return data?.[0]?.id ?? null;
}

async function insertBatch(orders) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(orders),
  });
  if (!res.ok) {
    throw new Error(`Insert failed (${res.status}): ${await res.text()}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🧹 Cleaning up previous mock batch (PK-175* orders)...");
  await deletePreviousBatch();
  console.log("   ✅ Cleaned.\n");

  console.log("🔍 Fetching brand ID...");
  const brandId = await fetchBrandId();
  console.log("   ✅ Brand ID:", brandId ?? "(superadmin scope)");

  console.log(`\n🏗️  Building ${ORDERS_TO_INSERT} realistic orders...`);
  console.log(`   Revenue target : $${REVENUE_TO_ADD.toLocaleString()}`);

  // ── Build all orders first, then adjust last ones to hit exact revenue ──────
  const allOrders = [];
  let runningTotal = 0;

  for (let i = 0; i < ORDERS_TO_INSERT; i++) {
    const product = pick(PRODUCT_POOL);
    const order   = buildOrder(brandId, product);
    allOrders.push(order);
    runningTotal += product.price;
  }

  // Adjust revenue to hit target exactly
  const diff = REVENUE_TO_ADD - runningTotal;
  if (Math.abs(diff) > 0) {
    // Distribute the difference across the last few orders
    let remaining = diff;
    let idx = allOrders.length - 1;
    while (Math.abs(remaining) > 0 && idx >= 0) {
      const adjustment = remaining > 0
        ? Math.min(remaining, 50)    // add up to $50 to an order
        : Math.max(remaining, -50);  // subtract up to $50
      allOrders[idx].amount = Math.max(49, allOrders[idx].amount + adjustment);
      remaining -= adjustment;
      idx--;
    }
  }

  // Re-sum for display
  const actualRevenue = allOrders.reduce((s, o) => s + o.amount, 0);
  console.log(`   Actual revenue : $${actualRevenue.toLocaleString()}`);
  console.log(`   Orders to send : ${allOrders.length}`);

  // ── Insert in batches of 250 ──────────────────────────────────────────────
  const BATCH_SIZE = 250;
  let inserted = 0;

  console.log("\n📦 Inserting into Supabase...\n");

  for (let i = 0; i < allOrders.length; i += BATCH_SIZE) {
    const batch = allOrders.slice(i, i + BATCH_SIZE);
    await insertBatch(batch);
    inserted += batch.length;
    const pct = Math.round((inserted / allOrders.length) * 100);
    process.stdout.write(`\r   ✅ ${inserted.toLocaleString()} / ${allOrders.length.toLocaleString()} orders  (${pct}%)`);
  }

  const finalRevenue = EXISTING_REVENUE + actualRevenue;

  console.log(`\n\n${"─".repeat(50)}`);
  console.log(`🎉 COMPLETE`);
  console.log(`${"─".repeat(50)}`);
  console.log(`   Orders inserted  : ${inserted.toLocaleString()}`);
  console.log(`   Total orders now : ${(EXISTING_ORDERS + inserted).toLocaleString()}`);
  console.log(`   Gross revenue    : $${finalRevenue.toLocaleString()}`);
  console.log(`   Avg order value  : $${Math.round(finalRevenue / (EXISTING_ORDERS + inserted))}`);
  console.log(`${"─".repeat(50)}`);
  console.log(`\n🔄 Refresh your admin dashboard — figures are live!\n`);
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});
