/**
 * Apply RUN_IN_SUPABASE_ADMIN_PORTAL_FIXES.sql via direct Postgres.
 * Requires SUPABASE_DB_URL or DATABASE_URL in .env.local
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { applyProjectEnv } from "./loadEnv.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sqlPath = join(root, "scripts", "sql", "RUN_IN_SUPABASE_ADMIN_PORTAL_FIXES.sql");
const env = applyProjectEnv();
const connectionString =
  env.SUPABASE_DB_URL || env.DATABASE_URL || env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  console.error("Set SUPABASE_DB_URL in .env.local, or paste this file in Supabase SQL Editor:");
  console.error("  scripts/sql/RUN_IN_SUPABASE_ADMIN_PORTAL_FIXES.sql");
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log("Applied admin portal fixes.");
  console.log("Log out and log back in as brand admin, then check /admin/orders and /admin/analytics.");
} catch (e) {
  console.error("Failed:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
