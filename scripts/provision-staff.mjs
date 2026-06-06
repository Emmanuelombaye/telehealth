/**
 * Create/update staff accounts via Supabase Admin API (no SQL auth.users access needed).
 *
 *   npm run auth:provision-staff
 *
 * Requires in .env.production:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Also requires RUN_IN_SUPABASE_STAFF_AUTH_ALL.sql (RPC helpers) in Supabase once.
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

async function rpcFixTokens() {
  const { error } = await admin.rpc("fix_auth_null_tokens");
  if (error) {
    console.warn("fix_auth_null_tokens RPC skipped:", error.message);
    console.warn("  → Run scripts/sql/RUN_IN_SUPABASE_STAFF_AUTH_ALL.sql in Supabase SQL Editor first");
    return false;
  }
  console.log("Fixed NULL auth token columns via RPC");
  return true;
}

async function rpcLookupStaffIds() {
  const { data, error } = await admin.rpc("lookup_staff_user_ids");
  if (error) return {};
  const map = {};
  for (const row of data ?? []) {
    if (row.email && row.user_id) map[row.email.toLowerCase()] = row.user_id;
  }
  return map;
}

async function rpcDeleteBrokenStaff() {
  const { error } = await admin.rpc("delete_broken_staff_auth_users");
  if (error) {
    console.warn("delete_broken_staff_auth_users skipped:", error.message);
    return false;
  }
  console.log("Removed broken staff auth rows (doctor/admin/brandon/pharmacy)");
  return true;
}

async function syncProfile(userId, account) {
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

async function upsertStaff(account, idMap) {
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

  const existingId = idMap[account.email.toLowerCase()];

  if (existingId) {
    const { data, error } = await admin.auth.admin.updateUserById(existingId, {
      password: account.password,
      email_confirm: true,
      app_metadata: appMeta,
      user_metadata: userMeta,
    });
    if (error) throw error;
    console.log(`Updated ${account.email}`);
    await syncProfile(data.user.id, account);
    return;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    app_metadata: appMeta,
    user_metadata: userMeta,
  });
  if (error) {
    if (error.message?.includes("already registered") || error.message?.includes("already exists")) {
      console.warn(`${account.email} exists but lookup failed — run delete_broken_staff RPC or AUTH_RESET_STAFF.sql`);
      return;
    }
    throw error;
  }
  console.log(`Created ${account.email}`);
  await syncProfile(data.user.id, account);
}

async function main() {
  console.log("Provisioning staff on", url, "\n");

  await rpcFixTokens();

  let idMap = await rpcLookupStaffIds();

  for (const account of STAFF) {
    try {
      await upsertStaff(account, idMap);
    } catch (e) {
      const msg = e.message ?? String(e);
      if (msg.includes("Database error") || msg.includes("querying schema")) {
        console.warn(`${account.email}: corrupt auth row — resetting staff auth...`);
        await rpcDeleteBrokenStaff();
        idMap = await rpcLookupStaffIds();
        try {
          await upsertStaff(account, idMap);
        } catch (e2) {
          console.error(`FAIL ${account.email} after reset:`, e2.message);
        }
      } else {
        console.error(`FAIL ${account.email}:`, msg);
      }
    }
  }

  console.log("\nDone. Run: npm run verify:portals");
}

main();
