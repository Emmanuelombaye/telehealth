/**
 * ============================================================================
 * PEAK HEALTH — FULL DATABASE MIGRATION (Old → New Supabase)
 * ============================================================================
 * Migrates ALL 35 tables from old project (vzzmdbdvcofajgrjgajq) to new
 * project (xtczoyjcgljxmqxmkkdh) using:
 *   1. Apply all supabase/migrations/*.sql in order
 *   2. Apply supplemental schema SQL files (adds missing columns)
 *   3. Dynamic schema sync: auto-detect columns in old DB, add missing ones
 *   4. Copy all data via REST API (old) → pg pooler (new), batch inserts
 *
 * Usage:
 *   node scripts/migrate-database.mjs
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;

// ── Credentials ───────────────────────────────────────────────────────────────
const OLD_SUPABASE_URL = 'https://vzzmdbdvcofajgrjgajq.supabase.co';
const OLD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6em1kYmR2Y29mYWpncmpnYWpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2MjI5NCwiZXhwIjoyMDk2MzM4Mjk0fQ.UTaWWdHsCSBRG1ZP4Rsp1ixnhUeMIJurUvxpowBAhCM';
const NEW_DB_CONN = 'postgresql://postgres.xtczoyjcgljxmqxmkkdh:@Kenya90!132323@aws-0-eu-west-3.pooler.supabase.com:6543/postgres';
const BATCH_SIZE = 50; // rows per transaction — keeps pooler connections alive

// ── All tables to migrate (ordered by FK dependencies) ──────────────────────
const TABLES = [
  // Core reference / lookup tables first
  'brands',
  'brand_hostnames',
  'partner_api_keys',
  'platform_settings',
  'platform_tools',
  'consult_routing_rules',
  'clinical_intake_templates',
  // People
  'profiles',
  'doctor_invitations',
  'affiliates',
  // Products / orders
  'products',
  'discounts',
  'orders',
  // Clinical
  'prescriptions',
  'appointments',
  'doctor_schedules',
  'lab_results',
  'admin_questionnaires',
  'intake_forms',
  'visit_forms',
  'visit_summaries',
  'vital_readings',
  // Communications / docs
  'messages',
  'notifications',
  'patient_documents',
  'documents',
  'phi_access_logs',
  'admin_audit_logs',
  // Scheduling / webhook
  'scheduling_pending_bookings',
  'pmci_webhook_events',
  // Insurance / billing
  'insurance_plans',
  'insurance_info',
  'billing_claims',
  // Identity / family
  'identity_verification',
  'family_members',
  // Legacy medical records
  'medical_records',
];

// ── Supplemental SQL files that add schema the migrations don't cover ─────────
// Listed in logical application order
const SUPPLEMENTAL_SQL = [
  'supabase_add_missing_columns.sql',
  'supabase_add_consultation_live.sql',
  'supabase_add_zoom_url.sql',
  'supabase_add_doctor_id_to_orders.sql',
  'scripts/sql/RUN_IN_SUPABASE_orders_shipping_columns.sql',
  'scripts/sql/add_orders_shipping_state.sql',
  'scripts/sql/add_orders_consult_routing_snapshot.sql',
];

// ── Helper: infer a permissive Postgres type from a JS value ─────────────────
function inferPgType(val) {
  if (val === null || val === undefined) return 'TEXT';
  if (typeof val === 'boolean') return 'BOOLEAN';
  if (typeof val === 'number') {
    return Number.isInteger(val) ? 'BIGINT' : 'NUMERIC';
  }
  if (typeof val === 'object') return 'JSONB';
  // Text heuristics
  if (/^\d{4}-\d{2}-\d{2}T[\d:.Z+-]+$/.test(val)) return 'TIMESTAMPTZ';
  return 'TEXT';
}

// ── Phase 1: Apply all official migrations ────────────────────────────────────
async function applyMigrations(client) {
  console.log('\n📂 [Phase 1] Applying supabase/migrations/*.sql ...');
  const migrationsDir = path.resolve('supabase/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`   Found ${files.length} migration files.`);

  const failedFiles = [];

  for (const file of files) {
    process.stdout.write(`   ▶ ${file} ... `);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await client.query(sql);
      console.log('✅');
    } catch (err) {
      if (err.message.includes('already exists') ||
          err.message.includes('already member of publication') ||
          err.message.includes('does not exist') && err.message.includes('trigger')) {
        console.log('⚠️  (skipped: already exists / benign)');
      } else {
        console.log(`⚠️  WARNING: ${err.message.slice(0, 120)}`);
        failedFiles.push(file);
      }
    }
  }

  // Second pass for anything that failed due to dependency ordering
  if (failedFiles.length > 0) {
    console.log(`\n   🔄 Retry pass for ${failedFiles.length} failed migrations...`);
    for (const file of failedFiles) {
      process.stdout.write(`   ▶ ${file} (retry) ... `);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      try {
        await client.query(sql);
        console.log('✅');
      } catch (err) {
        if (err.message.includes('already exists') ||
            err.message.includes('already member of publication')) {
          console.log('⚠️  (already exists — OK)');
        } else {
          console.log(`❌ FAILED: ${err.message.slice(0, 120)}`);
        }
      }
    }
  }
}

// ── Phase 2: Apply supplemental schema SQL files ──────────────────────────────
async function applySupplementalSQL(client) {
  console.log('\n📝 [Phase 2] Applying supplemental schema SQL files...');
  const root = path.resolve('.');

  for (const relPath of SUPPLEMENTAL_SQL) {
    const filePath = path.join(root, relPath);
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  Not found (skipping): ${relPath}`);
      continue;
    }
    process.stdout.write(`   ▶ ${relPath} ... `);
    let sql = fs.readFileSync(filePath, 'utf8');
    // Remove RAISE NOTICE lines which pg client can't execute as standalone stmts
    sql = sql.replace(/RAISE NOTICE[^;]+;/gi, '');
    try {
      await client.query(sql);
      console.log('✅');
    } catch (err) {
      if (err.message.includes('already exists') ||
          err.message.includes('already member of publication')) {
        console.log('⚠️  (already exists — OK)');
      } else {
        console.log(`⚠️  WARNING: ${err.message.slice(0, 120)}`);
      }
    }
  }

  // Ensure discounts table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.discounts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      value NUMERIC NOT NULL,
      active BOOLEAN DEFAULT true,
      usage_limit INTEGER DEFAULT 100,
      times_used INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `);
  console.log('   ✅ discounts table ensured.');
}

// ── Phase 3: Dynamic schema sync ─────────────────────────────────────────────
// For each table: fetch a sample from old DB, detect extra columns, ADD them.
async function syncSchema(client, oldSupabase) {
  console.log('\n🔍 [Phase 3] Dynamic schema synchronization...');

  for (const table of TABLES) {
    // Get columns currently in new DB
    const { rows: existingCols } = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1`,
      [table]
    );
    const newDbCols = new Set(existingCols.map(r => r.column_name));

    // Get a sample from old DB to discover all columns it has
    const { data, error } = await oldSupabase
      .from(table)
      .select('*')
      .limit(100);

    if (error) {
      if (error.message.includes('Could not find the table') ||
          error.code === 'PGRST116') {
        // Table doesn't exist in old DB — skip
        continue;
      }
      console.log(`   ⚠️  Could not sample ${table}: ${error.message}`);
      continue;
    }

    if (!data || data.length === 0) {
      // Empty table — no columns to infer
      continue;
    }

    // Collect all column names from sample rows
    const sampleCols = new Set();
    const colTypes = {};
    for (const row of data) {
      for (const [col, val] of Object.entries(row)) {
        sampleCols.add(col);
        if (!(col in colTypes) && val !== null && val !== undefined) {
          colTypes[col] = inferPgType(val);
        }
      }
    }

    // Detect missing columns
    const missing = [...sampleCols].filter(c => !newDbCols.has(c));
    if (missing.length === 0) continue;

    console.log(`   📊 ${table}: adding ${missing.length} missing column(s): ${missing.join(', ')}`);

    for (const col of missing) {
      const pgType = colTypes[col] || 'TEXT';
      try {
        await client.query(
          `ALTER TABLE public."${table}" ADD COLUMN IF NOT EXISTS "${col}" ${pgType}`
        );
        process.stdout.write(`      + ${col} (${pgType})\n`);
      } catch (err) {
        console.log(`      ⚠️  Could not add ${col}: ${err.message.slice(0, 80)}`);
      }
    }
  }

  console.log('   ✅ Dynamic schema sync complete.');
}

// ── Helper: escape a JS value as a Postgres literal for COPY-style multi-row INSERT ──
function pgLiteral(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    // JSONB — stringify and escape
    return "'" + JSON.stringify(val).replace(/'/g, "''") + "'";
  }
  // String — escape single quotes
  return "'" + String(val).replace(/'/g, "''") + "'";
}

// ── Phase 4: Copy data — single persistent connection, reconnect only on drop ──
async function migrateData(oldSupabase) {
  console.log('\n📦 [Phase 4] Copying data (single connection, multi-row INSERT 200/stmt)...');

  const MULTI_ROW_SIZE = 200;
  const results = [];

  // One connection for ALL tables — avoids pooler connection limit
  async function openConn() {
    const c = new Client({ connectionString: NEW_DB_CONN });
    await c.connect();
    await c.query("SET session_replication_role = 'replica';");
    await c.query("SET statement_timeout = '0';"); // no timeout — we manage it ourselves
    return c;
  }

  let conn = await openConn();
  console.log('   🔌 Persistent connection established.');

  for (const table of TABLES) {
    console.log(`\n   ──────────────────────────────────────`);
    console.log(`   📦 Table: ${table}`);

    // Ping to ensure connection is alive; reconnect if needed
    try {
      await conn.query('SELECT 1');
    } catch (_) {
      console.log('      ♻️  Reconnecting...');
      try { await conn.end(); } catch (_) {}
      conn = await openConn();
    }

    try {
      // Clear destination
      try {
        await conn.query(`DELETE FROM public."${table}";`);
        console.log(`      Cleared existing rows.`);
      } catch (err) {
        console.log(`      ⚠️  Could not clear: ${err.message.slice(0, 80)}`);
      }

      // Paginate all rows from old DB via REST
      let allRows = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      let skipTable = false;

      while (hasMore) {
        const { data, error } = await oldSupabase
          .from(table)
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          if (error.message.includes('Could not find the table') || error.code === 'PGRST116') {
            console.log(`      ⚠️  Not in old DB — skipping.`);
            skipTable = true; break;
          }
          console.log(`      ❌ Fetch error: ${error.message}`);
          skipTable = true; break;
        }
        if (data && data.length > 0) {
          allRows = allRows.concat(data);
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      if (skipTable) { results.push({ table, status: 'skipped', rows: 0 }); continue; }
      console.log(`      Fetched ${allRows.length} rows.`);
      if (allRows.length === 0) { results.push({ table, status: 'empty', rows: 0 }); continue; }

      const columns = Object.keys(allRows[0]);
      const columnNames = columns.map(col => `"${col}"`).join(', ');
      let inserted = 0;
      let errored = 0;

      await conn.query('BEGIN');

      for (let batchStart = 0; batchStart < allRows.length; batchStart += MULTI_ROW_SIZE) {
        const batch = allRows.slice(batchStart, batchStart + MULTI_ROW_SIZE);

        const valuesClauses = batch.map(row => {
          const vals = columns.map(col => pgLiteral(row[col]));
          return `(${vals.join(', ')})`;
        });
        const sql = `INSERT INTO public."${table}" (${columnNames}) VALUES\n${valuesClauses.join(',\n')} ON CONFLICT DO NOTHING;`;

        try {
          const res = await conn.query(sql);
          inserted += res.rowCount || batch.length;
        } catch (batchErr) {
          console.log(`      ⚠️  Batch failed (${batchErr.message.slice(0, 80)}), row-by-row fallback...`);
          try { await conn.query('ROLLBACK'); } catch (_) {}
          await conn.query('BEGIN');

          for (let i = 0; i < batch.length; i++) {
            const row = batch[i];
            const values = columns.map(col => {
              const val = row[col];
              if (val !== null && typeof val === 'object') return JSON.stringify(val);
              return val;
            });
            const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
            try {
              await conn.query(
                `INSERT INTO public."${table}" (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`,
                values
              );
              inserted++;
            } catch (rowErr) {
              errored++;
              if (errored <= 3) console.log(`      ⚠️  Row ${batchStart + i + 1}: ${rowErr.message.slice(0, 80)}`);
            }
          }
        }

        if ((batchStart + MULTI_ROW_SIZE) % 2000 === 0) {
          console.log(`      ... ${Math.min(batchStart + MULTI_ROW_SIZE, allRows.length)} / ${allRows.length}`);
        }
      }

      await conn.query('COMMIT');
      console.log(`      ✅ Inserted ${inserted} / ${allRows.length} rows (${errored} errors).`);
      results.push({ table, status: 'done', rows: inserted, errors: errored });

    } catch (fatalErr) {
      try { await conn.query('ROLLBACK'); } catch (_) {}
      console.log(`      ❌ Fatal: ${fatalErr.message}`);
      results.push({ table, status: 'fatal_error', rows: 0 });
      // Reconnect after fatal error
      try { await conn.end(); } catch (_) {}
      try { conn = await openConn(); } catch (_) {}
    }
  }

  try { await conn.query("SET session_replication_role = 'origin';"); } catch (_) {}
  try { await conn.end(); } catch (_) {}
  console.log('\n   🔌 Connection closed.');

  return results;
}

// ── Phase 5: Final schema patching (post-data) ────────────────────────────────
async function applyPostDataPatches(client) {
  console.log('\n🔧 [Phase 5] Post-data schema patches...');

  // Create missing tables that are in old DB but not in migrations
  const extraTables = `
    -- partner_api_keys (needed for multi-tenant partner API)
    CREATE TABLE IF NOT EXISTS public.partner_api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
      label TEXT NOT NULL DEFAULT 'default',
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
      last_used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT partner_api_keys_brand_label_unique UNIQUE (brand_id, label)
    );

    -- platform_tools
    CREATE TABLE IF NOT EXISTS public.platform_tools (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'available',
      category TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- insurance_info
    CREATE TABLE IF NOT EXISTS public.insurance_info (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      provider TEXT,
      plan_name TEXT,
      member_id TEXT,
      group_number TEXT,
      is_primary BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- documents (general)
    CREATE TABLE IF NOT EXISTS public.documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT,
      type TEXT,
      url TEXT,
      size TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- billing_claims
    CREATE TABLE IF NOT EXISTS public.billing_claims (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      service_name TEXT,
      provider_name TEXT,
      billed_amount NUMERIC,
      covered_amount NUMERIC,
      patient_responsibility NUMERIC,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- visit_forms
    CREATE TABLE IF NOT EXISTS public.visit_forms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'Visit form',
      visit_name TEXT,
      status TEXT DEFAULT 'pending',
      urgent BOOLEAN DEFAULT false,
      form_data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- visit_summaries
    CREATE TABLE IF NOT EXISTS public.visit_summaries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      doctor_id UUID REFERENCES auth.users(id),
      doctor_name TEXT,
      specialty TEXT,
      date TIMESTAMPTZ DEFAULT now(),
      type TEXT DEFAULT 'video',
      diagnosis TEXT,
      follow_up_date TIMESTAMPTZ,
      report_url TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- affiliates
    CREATE TABLE IF NOT EXISTS public.affiliates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      code TEXT UNIQUE,
      brand_id UUID REFERENCES public.brands(id),
      commission_rate NUMERIC DEFAULT 0.1,
      total_referrals INTEGER DEFAULT 0,
      total_earnings NUMERIC DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- medical_records
    CREATE TABLE IF NOT EXISTS public.medical_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      doctor_id UUID REFERENCES auth.users(id),
      appointment_id UUID,
      vitals JSONB DEFAULT '{}'::jsonb,
      allergies TEXT[],
      current_medications TEXT[],
      diagnoses TEXT[],
      clinical_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;

  try {
    await client.query(extraTables);
    console.log('   ✅ Extra tables ensured.');
  } catch (err) {
    console.log(`   ⚠️  Some extra table creation warnings: ${err.message.slice(0, 100)}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Use a dedicated connection for schema phases
  const schemaClient = new Client({ connectionString: NEW_DB_CONN });
  await schemaClient.connect();
  console.log('🔌 Connected to new Supabase database (connection pooler).');
  await schemaClient.query("SET session_replication_role = 'replica';");
  console.log('🔒 Replica mode enabled for schema phases.');

  const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SERVICE_KEY);

  try {
    await applyMigrations(schemaClient);
    await applySupplementalSQL(schemaClient);
    await applyPostDataPatches(schemaClient);
    await syncSchema(schemaClient, oldSupabase);
  } catch (err) {
    console.error('\n💥 Schema phase FAILED:', err.message);
    console.error(err.stack);
  } finally {
    try { await schemaClient.query("SET session_replication_role = 'origin';"); } catch (_) {}
    await schemaClient.end();
    console.log('🔌 Schema connection closed.');
  }

  // Data copy uses per-table fresh connections (avoids pooler drops on large tables)
  let results;
  try {
    results = await migrateData(oldSupabase);
  } catch (err) {
    console.error('\n💥 Data migration FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
  }

  // Print summary
  console.log('\n\n════════════════════════════════════════════════════════');
  console.log('                MIGRATION SUMMARY');
  console.log('════════════════════════════════════════════════════════');
  let totalRows = 0;
  for (const r of results) {
    const icon = r.status === 'done' ? '✅' : r.status === 'empty' ? '➖' : '⚠️ ';
    console.log(`  ${icon}  ${r.table.padEnd(35)} ${r.rows || 0} rows`);
    totalRows += r.rows || 0;
  }
  console.log('════════════════════════════════════════════════════════');
  console.log(`  TOTAL ROWS MIGRATED: ${totalRows}`);
  console.log('════════════════════════════════════════════════════════\n');
  console.log('✅ Migration complete!');
}

main();
