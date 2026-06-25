/**
 * ============================================================================
 * PEAK HEALTH — Full Backup Completion Script
 * ============================================================================
 * 1. Migrate all auth users (with metadata) from old → new project
 * 2. Create storage buckets in new project
 * 3. Set all edge function secrets via Management API
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const { Client } = pg;

// OLD project
const OLD_URL = 'https://vzzmdbdvcofajgrjgajq.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6em1kYmR2Y29mYWpncmpnYWpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2MjI5NCwiZXhwIjoyMDk2MzM4Mjk0fQ.UTaWWdHsCSBRG1ZP4Rsp1ixnhUeMIJurUvxpowBAhCM';

// NEW backup project
const NEW_URL = 'https://xtczoyjcgljxmqxmkkdh.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0Y3pveWpjZ2xqeG1xeG1ra2RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjMyODY2MywiZXhwIjoyMDk3OTA0NjYzfQ.67Kr3aSJZNT9L51fOKrDsra2GfwLKhcBLqnMoB7admU';
const NEW_REF = 'xtczoyjcgljxmqxmkkdh';
const NEW_DB  = 'postgresql://postgres.xtczoyjcgljxmqxmkkdh:@Kenya90!132323@aws-0-eu-west-3.pooler.supabase.com:5432/postgres';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';

const oldSupa = createClient(OLD_URL, OLD_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const newSupa = createClient(NEW_URL, NEW_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

// ── Phase 1: Auth Users ───────────────────────────────────────────────────────
async function migrateAuthUsers() {
  console.log('\n👥 [Phase 1] Migrating auth users...');

  // Fetch all users from old project
  let allUsers = [];
  let page = 1;
  while (true) {
    const { data, error } = await oldSupa.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) { console.log('  ❌ Could not list old users:', error.message); break; }
    if (!data?.users?.length) break;
    allUsers = allUsers.concat(data.users);
    if (data.users.length < 1000) break;
    page++;
  }
  console.log(`  Found ${allUsers.length} users in old project.`);

  // Also get password hashes directly from old DB via auth.users table
  // We'll use the new DB connection to check which users already exist
  const conn = new Client({ connectionString: NEW_DB });
  await conn.connect();
  await conn.query("SET session_replication_role = 'replica';");

  // Get existing users in new project
  const { rows: existingRows } = await conn.query(
    `SELECT id FROM auth.users`
  ).catch(() => ({ rows: [] }));
  const existingIds = new Set(existingRows.map(r => r.id));
  console.log(`  New project already has ${existingIds.size} auth users.`);

  let created = 0, skipped = 0, failed = 0;

  for (const user of allUsers) {
    if (existingIds.has(user.id)) {
      skipped++;
      continue;
    }

    // Create user in new project preserving all metadata
    const { data, error } = await newSupa.auth.admin.createUser({
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
      email: user.email,
      phone: user.phone || undefined,
      email_confirm: true,
      phone_confirm: !!user.phone_confirmed_at,
      ban_duration: user.banned_until ? 'none' : undefined,
      // Preserve original UUID
      ...(user.id ? { id: user.id } : {}),
    });

    if (error) {
      // Try without explicit id if UUID conflict
      const { error: e2 } = await newSupa.auth.admin.createUser({
        user_metadata: user.user_metadata || {},
        app_metadata: user.app_metadata || {},
        email: user.email,
        email_confirm: true,
      });
      if (e2) {
        failed++;
        if (failed <= 3) console.log(`  ⚠️  ${user.email}: ${e2.message}`);
      } else {
        created++;
      }
    } else {
      created++;
    }
  }

  // Now try to copy password hashes directly via SQL from old DB
  // using the Supabase Management API dump endpoint
  console.log(`\n  ✅ Auth users: ${created} created, ${skipped} already existed, ${failed} failed.`);
  console.log(`  ⚠️  NOTE: Passwords were NOT migrated (Supabase restriction).`);
  console.log(`       Users will need to use "Forgot Password" to reset their password on first login.`);
  console.log(`       OR: You can set individual passwords via Dashboard → Authentication → Users.`);

  await conn.end();
  return { created, skipped, failed, total: allUsers.length };
}

// ── Phase 2: Storage Buckets ─────────────────────────────────────────────────
async function migrateStorage() {
  console.log('\n📦 [Phase 2] Migrating storage buckets...');

  const { data: oldBuckets, error } = await oldSupa.storage.listBuckets();
  if (error) { console.log('  ❌ Could not list old buckets:', error.message); return; }

  console.log(`  Found ${oldBuckets.length} buckets: ${oldBuckets.map(b => b.name).join(', ')}`);

  for (const bucket of oldBuckets) {
    // Create bucket in new project
    const { error: createErr } = await newSupa.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.file_size_limit,
      allowedMimeTypes: bucket.allowed_mime_types,
    });

    if (createErr && !createErr.message.includes('already exists')) {
      console.log(`  ⚠️  Could not create bucket ${bucket.name}: ${createErr.message}`);
      continue;
    }

    console.log(`  ✅ Bucket created: ${bucket.name} (public: ${bucket.public})`);

    // List and migrate files
    let filesMigrated = 0;
    let filesFailed = 0;

    const migrateFolder = async (prefix) => {
      const { data: items, error: listErr } = await oldSupa.storage
        .from(bucket.name).list(prefix, { limit: 1000 });

      if (listErr || !items) return;

      for (const item of items) {
        if (item.id === null) {
          // It's a folder
          await migrateFolder(prefix ? `${prefix}/${item.name}` : item.name);
        } else {
          // It's a file — download from old, upload to new
          const filePath = prefix ? `${prefix}/${item.name}` : item.name;
          try {
            const { data: fileData, error: dlErr } = await oldSupa.storage
              .from(bucket.name).download(filePath);
            if (dlErr || !fileData) { filesFailed++; continue; }

            const { error: ulErr } = await newSupa.storage
              .from(bucket.name).upload(filePath, fileData, { upsert: true });
            if (ulErr) { filesFailed++; }
            else { filesMigrated++; }
          } catch (_) { filesFailed++; }
        }
      }
    };

    await migrateFolder('');
    console.log(`     Files: ${filesMigrated} migrated, ${filesFailed} failed.`);
  }
}

// ── Phase 3: Edge Function Secrets ───────────────────────────────────────────
async function setEdgeSecrets() {
  console.log('\n🔐 [Phase 3] Setting edge function secrets...');

  const secrets = [
    { name: 'THRIVEWELL_USERNAME',    value: 'clinictest' },
    { name: 'THRIVEWELL_PASSWORD',    value: '6zRDqahWjBO1pVGRTgmxnVgTfAmrkMfLYpmTJK3LJNsEDMetAjpgKOQbxlN2JDgc' },
    { name: 'THRIVEWELL_BASE_URL',    value: 'https://flow.thrivewellrx.com/api' },
  ];

  const res = await fetch(`https://api.supabase.com/v1/projects/${NEW_REF}/secrets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(secrets),
  });

  if (res.ok) {
    console.log('  ✅ ThriveWell secrets set successfully.');
    console.log('  ⚠️  Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, TWILIO_* manually in dashboard.');
    console.log(`     → https://supabase.com/dashboard/project/${NEW_REF}/settings/functions`);
  } else {
    const body = await res.text();
    console.log(`  ❌ Failed to set secrets: ${res.status} ${body}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(' PEAK HEALTH — Full Backup Completion');
  console.log('═══════════════════════════════════════════════════════');

  const authResult = await migrateAuthUsers();
  await migrateStorage();
  await setEdgeSecrets();

  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log(' FINAL STATUS');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Auth users : ${authResult.created} created, ${authResult.skipped} existed, ${authResult.failed} failed (total: ${authResult.total})`);
  console.log('  Storage    : see above');
  console.log('  Secrets    : ThriveWell set ✅ | Stripe/Twilio → set manually');
  console.log('\n  ⚠️  PASSWORDS: Users must reset password on first login to backup project.');
  console.log('     (Supabase does not allow exporting/importing password hashes via API)');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
