/**
 * Create or promote brandon@peakbodyco.com to super_admin (production-safe).
 *
 * Requires in .env.local (never commit):
 *   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 *   npm run auth:promote-super-admin
 *
 * Optional env:
 *   SUPERADMIN_EMAIL=brandon@peakbodyco.com
 *   SUPERADMIN_PASSWORD=...
 */

import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { applyProjectEnv } from "./loadEnv.mjs";

global.WebSocket = ws;

const env = applyProjectEnv();
const url = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || "").trim();
const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const email = (env.SUPERADMIN_EMAIL || "brandon@peakbodyco.com").trim().toLowerCase();
const password = env.SUPERADMIN_PASSWORD || "@incorrect!";

if (!url || !serviceKey) {
  console.error(
    "Missing VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Add them to .env.local, or run scripts/sql/RUN_IN_SUPABASE_SUPERADMIN_AUTH.sql in Supabase SQL Editor.",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const appMeta = { role: "super_admin", brand_id: "peak" };
const userMeta = {
  role: "super_admin",
  brand_id: "peak",
  first_name: "Brandon",
  last_name: "Admin",
  full_name: "Brandon Admin",
};

async function findUserByEmail(targetEmail) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === targetEmail);
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  console.log("\nPeak Health — Super Admin provisioning");
  console.log("========================================");
  console.log(`Project: ${url}`);
  console.log(`Email:   ${email}\n`);

  let user = await findUserByEmail(email);

  if (!user) {
    console.log("User not found — creating with service role...");
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: appMeta,
      user_metadata: userMeta,
    });
    if (error) throw error;
    user = data.user;
    console.log("Created user:", user.id);
  } else {
    console.log("User exists — updating role metadata...");
    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      app_metadata: { ...user.app_metadata, ...appMeta },
      user_metadata: { ...user.user_metadata, ...userMeta },
    });
    if (error) throw error;
    user = data.user;
    console.log("Updated user:", user.id);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email,
      role: "super_admin",
      brand_id: "peak",
      full_name: "Brandon Admin",
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.warn("Profile upsert warning (check RLS / columns):", profileError.message);
  } else {
    console.log("Profile row synced.");
  }

  const { data: signIn, error: signInError } = await createClient(url, env.VITE_SUPABASE_ANON_KEY || serviceKey, {
    auth: { persistSession: false },
  }).auth.signInWithPassword({ email, password });

  if (signInError) {
    console.warn("\nLogin probe failed:", signInError.message);
    console.warn("Check Supabase Dashboard → Logs → Auth for 500 errors.");
    console.warn("Run scripts/sql/RUN_IN_SUPABASE_SUPERADMIN_AUTH.sql if the trigger is broken.");
  } else {
    const role =
      signIn.user?.app_metadata?.role || signIn.user?.user_metadata?.role || "(unknown)";
    console.log(`\nLogin probe OK — JWT role: ${role}`);
  }

  console.log("\nDone. Sign in at /superadmin/login with:");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
}

main().catch((err) => {
  console.error("\nFailed:", err.message || err);
  process.exit(1);
});
