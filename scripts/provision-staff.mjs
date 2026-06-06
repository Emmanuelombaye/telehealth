/**
 * Provision all staff accounts via service role.
 *   npm run auth:provision-staff
 */
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { applyProjectEnv } from "./loadEnv.mjs";

global.WebSocket = ws;

const STAFF = [
  {
    email: "doctor@peakbodyco.com",
    password: "password123",
    role: "doctor",
    name: "Clinical Provider",
  },
  {
    email: "admin@peakbodyco.com",
    password: "password123",
    role: "brand_admin",
    brandId: "peak",
    name: "Brand Administrator",
  },
  {
    email: "brandon@peakbodyco.com",
    password: "@incorrect!",
    role: "super_admin",
    brandId: "peak",
    name: "Brandon Admin",
  },
  {
    email: "pharmacy@peakbodyco.com",
    password: "password123",
    role: "pharmacy",
    name: "Pharmacy Fulfillment",
  },
  {
    email: "affiliate@peakbodyco.com",
    password: "password123",
    role: "affiliate",
    name: "Affiliate Partner",
  },
];

const env = applyProjectEnv();
const url = (env.VITE_SUPABASE_URL || "").trim();
const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!url || !serviceKey) {
  console.error("Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.production");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUser(email) {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
    page++;
  }
}

async function upsertStaff(account) {
  const appMeta = {
    role: account.role,
    ...(account.brandId ? { brand_id: account.brandId } : {}),
  };
  const userMeta = {
    role: account.role,
    full_name: account.name,
    first_name: account.name.split(" ")[0],
    last_name: account.name.split(" ").slice(1).join(" ") || "",
    ...(account.brandId ? { brand_id: account.brandId } : {}),
  };

  let userId;
  let existing = null;
  try {
    existing = await findUser(account.email);
  } catch (e) {
    console.warn(`listUsers skipped for ${account.email}:`, e.message);
  }

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password: account.password,
      email_confirm: true,
      app_metadata: { ...existing.app_metadata, ...appMeta },
      user_metadata: { ...existing.user_metadata, ...userMeta },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Updated ${account.email}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      app_metadata: appMeta,
      user_metadata: userMeta,
    });
    if (error) {
      if (error.message?.includes("already registered") || error.message?.includes("already exists")) {
        console.warn(`Skip ${account.email} — already exists but listUsers failed`);
        return;
      }
      throw error;
    }
    userId = data.user.id;
    console.log(`Created ${account.email}`);
  }

  if (!userId) return;

  await admin.from("profiles").upsert(
    {
      id: userId,
      email: account.email,
      role: account.role,
      brand_id: account.brandId ?? null,
      full_name: account.name,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
}

async function main() {
  console.log("Provisioning staff on", url, "\n");
  for (const account of STAFF) {
    try {
      await upsertStaff(account);
    } catch (e) {
      console.error(`FAIL ${account.email}:`, e.message);
    }
  }
  console.log("\nDone. Run: npm run verify:portals");
}

main();
