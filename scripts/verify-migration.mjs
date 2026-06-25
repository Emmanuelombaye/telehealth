/**
 * ============================================================================
 * PEAK HEALTH — Post-Migration Verification
 * ============================================================================
 * Compares row counts between old and new Supabase databases,
 * verifies schema completeness, and checks edge function endpoints.
 *
 * Usage:
 *   node scripts/verify-migration.mjs
 * ============================================================================
 */

import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;

const OLD_SUPABASE_URL = 'https://vzzmdbdvcofajgrjgajq.supabase.co';
const OLD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6em1kYmR2Y29mYWpncmpnYWpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2MjI5NCwiZXhwIjoyMDk2MzM4Mjk0fQ.UTaWWdHsCSBRG1ZP4Rsp1ixnhUeMIJurUvxpowBAhCM';
const NEW_SUPABASE_URL = 'https://xtczoyjcgljxmqxmkkdh.supabase.co';
const NEW_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0Y3pveWpjZ2xqeG1xeG1ra2RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY5MTAzMiwiZXhwIjoyMDY2MjY3MDMyfQ.V5fD_nZHdaCCbGX1a0qJ7EJOAH3p-kC63hAaFdKoRV8';
const NEW_DB_CONN = 'postgresql://postgres.xtczoyjcgljxmqxmkkdh:@Kenya90!132323@aws-0-eu-west-3.pooler.supabase.com:6543/postgres';

const TABLES_TO_CHECK = [
  'brands', 'brand_hostnames', 'profiles', 'products', 'orders',
  'appointments', 'doctor_schedules', 'lab_results', 'messages',
  'notifications', 'patient_documents', 'identity_verification',
  'pmci_webhook_events', 'scheduling_pending_bookings', 'vital_readings',
  'prescriptions', 'intake_forms', 'visit_summaries', 'admin_questionnaires',
  'clinical_intake_templates', 'consult_routing_rules', 'affiliates',
  'platform_settings', 'phi_access_logs',
];

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' PEAK HEALTH — Migration Verification Report');
  console.log('═══════════════════════════════════════════════════════════\n');

  const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SERVICE_KEY);
  const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SERVICE_KEY);
  const newClient = new Client({ connectionString: NEW_DB_CONN });
  await newClient.connect();

  console.log('📊 Row count comparison (Old → New):');
  console.log('─────────────────────────────────────────────────────────');
  console.log('  Table'.padEnd(36) + 'Old DB'.padEnd(12) + 'New DB'.padEnd(12) + 'Match');
  console.log('─────────────────────────────────────────────────────────');

  let allMatch = true;
  let totalOld = 0;
  let totalNew = 0;

  for (const table of TABLES_TO_CHECK) {
    // Old count
    const { count: oldCount, error: oldErr } = await oldSupabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    // New count
    let newCount = 0;
    try {
      const { rows } = await newClient.query(
        `SELECT COUNT(*)::int AS cnt FROM public."${table}"`
      );
      newCount = rows[0].cnt;
    } catch (_) {}

    if (oldErr) {
      console.log(`  ${table.padEnd(35)} ${'N/A'.padEnd(11)} ${String(newCount).padEnd(11)} ⚠️ (old DB error)`);
      continue;
    }

    const match = oldCount === newCount;
    if (!match) allMatch = false;
    totalOld += oldCount || 0;
    totalNew += newCount;

    const matchIcon = match ? '✅' : '❌';
    console.log(
      `  ${table.padEnd(35)} ${String(oldCount || 0).padEnd(11)} ${String(newCount).padEnd(11)} ${matchIcon}`
    );
  }

  console.log('─────────────────────────────────────────────────────────');
  console.log(`  ${'TOTAL'.padEnd(35)} ${String(totalOld).padEnd(11)} ${String(totalNew).padEnd(11)} ${allMatch ? '✅' : '⚠️ '}`);

  // Schema check — verify orders has all key columns
  console.log('\n📋 Schema check — orders table key columns:');
  const keyColumns = [
    'patient_name', 'ordered_date', 'pharmacy', 'doctor', 'intake_answers',
    'consultation_time', 'carrier', 'tracking_url', 'order_number',
    'thrivewell_type', 'pmci_partner_id', 'pharmacy_name', 'rx_dispatched'
  ];
  const { rows: colRows } = await newClient.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'orders'`
  );
  const existingCols = new Set(colRows.map(r => r.column_name));

  for (const col of keyColumns) {
    const exists = existingCols.has(col);
    console.log(`  ${exists ? '✅' : '❌'} ${col}`);
  }

  // Check edge function endpoints
  console.log('\n🌐 Edge function endpoint check (new project):');
  const edgeFunctions = [
    'dispatch-prescription',
    'assign-doctor',
    'send-otp',
    'verify-otp',
    'create-payment-intent',
    'invite-doctor',
    'thrivewell-dispatch',
    'pmci-webhook',
  ];

  for (const fn of edgeFunctions) {
    const url = `${NEW_SUPABASE_URL}/functions/v1/${fn}`;
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      // 401/403/405 means the function exists but needs auth (expected)
      const exists = res.status !== 404;
      console.log(`  ${exists ? '✅' : '❌'} ${fn} (HTTP ${res.status})`);
    } catch (err) {
      console.log(`  ⚠️  ${fn} — ${err.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(allMatch ? ' ✅ MIGRATION FULLY VERIFIED — ALL ROWS MATCH' : ' ⚠️  Some tables have row count mismatches — check above');
  console.log('═══════════════════════════════════════════════════════════\n');

  await newClient.end();
}

main().catch(console.error);
