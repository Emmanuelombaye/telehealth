/**
 * ============================================================================
 * PEAK HEALTH — Migrate Remaining Tables (continuation run)
 * ============================================================================
 * Orders + core tables are already in the new DB.
 * This script migrates ONLY the remaining tables via port 5432 (session mode).
 * ============================================================================
 */

import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;

// Use port 5432 session-mode pooler — more stable than 6543 transaction-mode
const NEW_DB_CONN = 'postgresql://postgres.xtczoyjcgljxmqxmkkdh:@Kenya90!132323@aws-0-eu-west-3.pooler.supabase.com:5432/postgres';

const OLD_SUPABASE_URL = 'https://vzzmdbdvcofajgrjgajq.supabase.co';
const OLD_SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6em1kYmR2Y29mYWpncmpnYWpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2MjI5NCwiZXhwIjoyMDk2MzM4Mjk0fQ.UTaWWdHsCSBRG1ZP4Rsp1ixnhUeMIJurUvxpowBAhCM';

// ── ONLY the tables NOT yet migrated ─────────────────────────────────────────
const REMAINING_TABLES = [
  'prescriptions',
  'appointments',
  'doctor_schedules',
  'lab_results',
  'admin_questionnaires',
  'intake_forms',
  'visit_forms',
  'visit_summaries',
  'vital_readings',
  'messages',
  'notifications',
  'patient_documents',
  'documents',
  'phi_access_logs',
  'admin_audit_logs',
  'scheduling_pending_bookings',
  'pmci_webhook_events',
  'insurance_plans',
  'insurance_info',
  'billing_claims',
  'identity_verification',
  'family_members',
  'medical_records',
];

// ── Escape a JS value to a Postgres literal ───────────────────────────────────
function pgLiteral(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return "'" + JSON.stringify(val).replace(/'/g, "''") + "'";
  return "'" + String(val).replace(/'/g, "''") + "'";
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(' PEAK HEALTH — Remaining Tables Migration');
  console.log(' Using port 5432 (session-mode pooler)');
  console.log('═══════════════════════════════════════════════════════\n');

  const oldSupa = createClient(OLD_SUPABASE_URL, OLD_SERVICE_KEY);

  // Single persistent connection for all tables
  const conn = new Client({ connectionString: NEW_DB_CONN });
  await conn.connect();
  console.log('🔌 Connected to new DB (port 5432 session mode).\n');

  await conn.query("SET session_replication_role = 'replica';");
  await conn.query("SET statement_timeout = '0';");

  const BATCH = 200;
  const results = [];

  for (const table of REMAINING_TABLES) {
    console.log(`\n──────────────────────────────────────`);
    console.log(`📦 Table: ${table}`);

    // Ping / health check
    try { await conn.query('SELECT 1'); } catch (_) {
      console.log('  ♻️  Reconnecting...');
      try { await conn.end(); } catch (_) {}
      const nc = new Client({ connectionString: NEW_DB_CONN });
      await nc.connect();
      await nc.query("SET session_replication_role = 'replica';");
      await nc.query("SET statement_timeout = '0';");
      Object.assign(conn, nc); // replace conn internals
    }

    // Fetch all rows from old DB (paginate 1000 at a time)
    let allRows = [];
    let page = 0;
    let skip = false;

    while (true) {
      const { data, error } = await oldSupa
        .from(table).select('*')
        .range(page * 1000, (page + 1) * 1000 - 1);

      if (error) {
        if (error.message.includes('Could not find') || error.code === 'PGRST116') {
          console.log('  ⚠️  Not in old DB — skipping.'); skip = true; break;
        }
        console.log(`  ❌ Fetch error: ${error.message}`); skip = true; break;
      }
      if (!data || data.length === 0) break;
      allRows = allRows.concat(data);
      if (data.length < 1000) break;
      page++;
    }

    if (skip) { results.push({ table, status: 'skipped', rows: 0 }); continue; }
    console.log(`  Fetched ${allRows.length} rows.`);
    if (allRows.length === 0) { results.push({ table, status: 'empty', rows: 0 }); continue; }

    // Dynamic schema sync — add any missing columns detected in old DB rows
    const { rows: existingCols } = await conn.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1`, [table]
    );
    const newDbCols = new Set(existingCols.map(r => r.column_name));
    const sampleKeys = new Set(allRows.flatMap(r => Object.keys(r)));
    const missing = [...sampleKeys].filter(c => !newDbCols.has(c));
    if (missing.length > 0) {
      console.log(`  🔧 Adding ${missing.length} missing columns: ${missing.join(', ')}`);
      for (const col of missing) {
        try {
          await conn.query(`ALTER TABLE public."${table}" ADD COLUMN IF NOT EXISTS "${col}" TEXT`);
        } catch (_) {}
      }
    }

    // Clear destination
    try {
      await conn.query(`DELETE FROM public."${table}";`);
      console.log(`  Cleared existing rows.`);
    } catch (e) {
      console.log(`  ⚠️  Could not clear: ${e.message.slice(0, 60)}`);
    }

    const columns = Object.keys(allRows[0]);
    const colNames = columns.map(c => `"${c}"`).join(', ');
    let inserted = 0, errored = 0;

    await conn.query('BEGIN');

    for (let start = 0; start < allRows.length; start += BATCH) {
      const batch = allRows.slice(start, start + BATCH);
      const valuesClauses = batch.map(row =>
        '(' + columns.map(c => pgLiteral(row[c])).join(', ') + ')'
      );
      const sql = `INSERT INTO public."${table}" (${colNames}) VALUES\n${valuesClauses.join(',\n')} ON CONFLICT DO NOTHING;`;

      try {
        const res = await conn.query(sql);
        inserted += res.rowCount || batch.length;
      } catch (batchErr) {
        // Fallback: row-by-row with parameterized queries
        console.log(`  ⚠️  Batch failed (${batchErr.message.slice(0, 70)}), row-by-row fallback...`);
        try { await conn.query('ROLLBACK'); } catch (_) {}
        await conn.query('BEGIN');

        for (let i = 0; i < batch.length; i++) {
          const row = batch[i];
          const vals = columns.map(c => {
            const v = row[c];
            return v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
          });
          const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
          try {
            await conn.query(
              `INSERT INTO public."${table}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`,
              vals
            );
            inserted++;
          } catch (rowErr) {
            errored++;
            if (errored <= 3) console.log(`  ⚠️  Row ${start + i + 1}: ${rowErr.message.slice(0, 80)}`);
          }
        }
      }

      if ((start + BATCH) % 2000 === 0) {
        console.log(`  ... ${Math.min(start + BATCH, allRows.length)} / ${allRows.length}`);
      }
    }

    await conn.query('COMMIT');
    console.log(`  ✅ Inserted ${inserted} / ${allRows.length} rows (${errored} errors).`);
    results.push({ table, status: 'done', rows: inserted, errors: errored });
  }

  try { await conn.query("SET session_replication_role = 'origin';"); } catch (_) {}
  await conn.end();

  // Summary
  console.log('\n\n════════════════════════════════════════════════════════');
  console.log('           REMAINING TABLES — MIGRATION SUMMARY');
  console.log('════════════════════════════════════════════════════════');
  let total = 0;
  for (const r of results) {
    const icon = r.status === 'done' ? '✅' : r.status === 'empty' ? '➖' : '⚠️ ';
    console.log(`  ${icon}  ${r.table.padEnd(32)} ${r.rows || 0} rows`);
    total += r.rows || 0;
  }
  console.log('════════════════════════════════════════════════════════');
  console.log(`  TOTAL NEW ROWS:  ${total}`);
  console.log('════════════════════════════════════════════════════════\n');
  console.log('✅ Done! Run verify-migration.mjs to confirm counts.');
}

main().catch(err => {
  console.error('💥 FATAL:', err.message);
  process.exit(1);
});
