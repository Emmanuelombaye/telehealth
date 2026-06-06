/**
 * Apply RUN_IN_SUPABASE_FIX_ALL_DATABASE.sql via direct Postgres (service DB URL).
 *
 * Usage (from repo root):
 *   $env:SUPABASE_DB_URL = "postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"
 *   node scripts/run-fix-all-database.mjs
 *
 * Or set DATABASE_URL / SUPABASE_DB_URL in .env.local (never commit passwords).
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sqlPath = join(root, "scripts", "sql", "RUN_IN_SUPABASE_FIX_ALL_DATABASE.sql");

function loadEnvLocal() {
  const p = join(root, ".env.local");
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = { ...loadEnvLocal(), ...process.env };
const connectionString =
  env.SUPABASE_DB_URL || env.DATABASE_URL || env.SUPABASE_DATABASE_URL;

if (!connectionString?.trim()) {
  console.error(
    "Missing SUPABASE_DB_URL (or DATABASE_URL).\n" +
      "Supabase Dashboard → Project Settings → Database → Connection string (URI).\n" +
      "Example: postgresql://postgres.[ref]:[YOUR-PASSWORD]@...supabase.com:5432/postgres",
  );
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
const client = new pg.Client({ connectionString: connectionString.trim() });

async function verify(client) {
  console.log("\n--- Post-run verification ---\n");

  const checks = [
    ["get_auth_role()", `SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_auth_role') AS ok`],
    ["get_auth_brand()", `SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_auth_brand') AS ok`],
    [
      "brands.north-star-md",
      `SELECT EXISTS (SELECT 1 FROM public.brands WHERE slug = 'north-star-md') AS ok`,
    ],
    [
      "North Star brand id",
      `SELECT EXISTS (SELECT 1 FROM public.brands WHERE id = 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c'::uuid) AS ok`,
    ],
    [
      "orders table",
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') AS ok`,
    ],
    [
      "queue-ready orders",
      `SELECT COUNT(*)::int AS cnt FROM public.orders WHERE status IN ('order_submitted','medical_review','id_verified','intake_completed')`,
    ],
    [
      "doctor profiles",
      `SELECT COUNT(*)::int AS cnt FROM public.profiles WHERE role = 'doctor'`,
    ],
    [
      "Peak sub_brand orders",
      `SELECT COUNT(*)::int AS cnt FROM public.orders WHERE coalesce(sub_brand,'') IN ('Peak Health', '')`,
    ],
    [
      "North Star sub_brand orders",
      `SELECT COUNT(*)::int AS cnt FROM public.orders WHERE sub_brand = 'c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c' OR sub_brand ILIKE '%north%'`,
    ],
  ];

  for (const [label, q] of checks) {
    try {
      const { rows } = await client.query(q);
      const row = rows[0];
      if ("ok" in row) {
        console.log(row.ok ? `\x1b[32mOK\x1b[0m` : `\x1b[31mFAIL\x1b[0m`, label);
      } else if ("cnt" in row) {
        console.log(`\x1b[36mINFO\x1b[0m ${label}: ${row.cnt}`);
      } else {
        console.log(`\x1b[36mINFO\x1b[0m ${label}:`, row);
      }
    } catch (e) {
      console.log(`\x1b[31mERR\x1b[0m ${label}:`, e.message);
    }
  }
}

async function main() {
  console.log("Applying RUN_IN_SUPABASE_FIX_ALL_DATABASE.sql …\n");
  await client.connect();
  console.log("Connected to Postgres.\n");

  try {
    await client.query(sql);
    console.log("\x1b[32mSQL script executed successfully.\x1b[0m\n");
  } catch (e) {
    console.error("\x1b[31mSQL execution failed:\x1b[0m", e.message);
    if (e.position) console.error("Position:", e.position);
    process.exitCode = 1;
  }

  await verify(client);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
